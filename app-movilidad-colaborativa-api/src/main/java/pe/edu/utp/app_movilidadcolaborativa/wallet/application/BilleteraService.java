package pe.edu.utp.app_movilidadcolaborativa.wallet.application;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.RestriccionesPasajeroService;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;
import pe.edu.utp.app_movilidadcolaborativa.wallet.application.LibroCreditos.Asiento;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.BilleteraDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.BilleteraDto.LimitesDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.BilleteraDto.ReservaRetenidaDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.BilleteraDto.RetiroPendienteDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.MovimientoDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.MovimientosDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RecargaDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RecargarRequest;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RetirarRequest;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RetiroDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.EstadoRetiro;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.MovimientoCredito;
import pe.edu.utp.app_movilidadcolaborativa.notifications.application.Notificador;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.Pago;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.Retiro;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.TipoMovimiento;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Supplier;

/**
 * Billetera (RF-11, RF-12): saldos, movimientos, recarga simulada con Yape (RN-41), retiro del conductor (RN-42) y
 * devolución de los retiros rechazados por el operador. Cada cambio de saldo pasa por {@link LibroCreditos}.
 */
@Service
@RequiredArgsConstructor
public class BilleteraService {

	static final int TAMANO_PAGINA = 20;
	private static final int INTENTOS = 3;
	private static final int CREDITOS_POR_SOL = 1;
	public static final String MENSAJE_CODIGO_USADO = "Este código de operación ya fue registrado";
	public static final String MENSAJE_RETIRO_PENDIENTE = "Ya tienes un retiro pendiente";

	private final UsuarioRepository usuarioRepository;
	private final MongoTemplate mongoTemplate;
	private final PlatformTransactionManager transactionManager;
	private final ParametrosService parametrosService;
	private final RestriccionesPasajeroService restriccionesPasajeroService;
	private final LibroCreditos libroCreditos;
	private final Notificador notificador;

	// ------------------------------------------------------------------ Consulta

	public BilleteraDto consultar(ObjectId usuarioId) {
		Usuario usuario = buscarUsuario(usuarioId);
		Parametros parametros = parametrosService.leer();
		int disponible = LibroCreditos.valor(usuario.getSaldoCreditos());

		// Solo las reservas que retuvieron créditos explican el retenido (las anteriores a la billetera no).
		ReservaRetenidaDto reserva = restriccionesPasajeroService.reservaActiva(usuarioId)
				.filter(activa -> Boolean.FALSE.equals(activa.liquidada()))
				.map(activa -> new ReservaRetenidaDto(activa.id().toHexString(), activa.viajeId().toHexString(),
						activa.viaje().fechaSalida(), activa.viaje().origen(), activa.viaje().destino(),
						activa.totalCreditos()))
				.orElse(null);
		Retiro pendiente = retiroPendiente(usuarioId);
		Retiro ultimo = mongoTemplate.findOne(Query.query(Criteria.where("usuario_id").is(usuarioId))
				.with(Sort.by(Sort.Direction.DESC, "fecha_solicitud")).limit(1), Retiro.class);

		return new BilleteraDto(
				disponible,
				LibroCreditos.valor(usuario.getCreditosRetenidos()),
				retirable(usuarioId, disponible),
				(usuario.getModoActivo() == null ? Rol.PASAJERO : usuario.getModoActivo()).getApi(),
				esConductor(usuario),
				reserva,
				pendiente == null ? null : new RetiroPendienteDto(pendiente.id().toHexString(), pendiente.creditos(),
						Retiro.ultimosTres(pendiente.celularYape()), pendiente.fechaSolicitud()),
				ultimo == null ? null : ultimo.celularYape(),
				new LimitesDto(parametros.recargaMinima(), parametros.recargaMaxima(), parametros.retiroMinimo()));
	}

	/** Movimientos del más reciente al más antiguo, con el estado actual de cada retiro. */
	public MovimientosDto movimientos(ObjectId usuarioId, int pagina) {
		buscarUsuario(usuarioId);
		Query consulta = Query.query(Criteria.where("usuario_id").is(usuarioId))
				.with(Sort.by(Sort.Direction.DESC, "fecha_creacion").and(Sort.by(Sort.Direction.DESC, "_id")))
				.skip((long) (pagina - 1) * TAMANO_PAGINA)
				.limit(TAMANO_PAGINA + 1);
		List<MovimientoCredito> encontrados = mongoTemplate.find(consulta, MovimientoCredito.class);
		boolean hayMas = encontrados.size() > TAMANO_PAGINA;
		List<MovimientoCredito> movimientos = hayMas ? encontrados.subList(0, TAMANO_PAGINA) : encontrados;

		List<ObjectId> retiroIds = movimientos.stream().map(MovimientoCredito::retiroId).filter(Objects::nonNull)
				.distinct().toList();
		Map<ObjectId, Retiro> retiros = new HashMap<>();
		if (!retiroIds.isEmpty()) {
			mongoTemplate.find(Query.query(Criteria.where("_id").in(retiroIds)), Retiro.class)
					.forEach(retiro -> retiros.put(retiro.id(), retiro));
		}
		return new MovimientosDto(movimientos.stream()
				.map(movimiento -> MovimientoDto.desde(movimiento,
						movimiento.retiroId() == null ? null : retiros.get(movimiento.retiroId())))
				.toList(), pagina, hayMas);
	}

	// ------------------------------------------------------------------ Recarga

	/** RN-41: crea el pago APROBADO, el movimiento RECARGA y sube el saldo, en una transacción. */
	public RecargaDto recargar(ObjectId usuarioId, RecargarRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		if (usuario.getEstado() == EstadoUsuario.PERFIL_PENDIENTE) {
			throw new ApiException(CodigoError.PROFILE_INCOMPLETE, "Completa tu perfil antes de recargar créditos");
		}
		Parametros parametros = parametrosService.leer();
		int soles = solicitud.amount();
		if (soles < parametros.recargaMinima() || soles > parametros.recargaMaxima()) {
			throw new ValidacionException("amount", "Elige un monto entre S/ %d y S/ %d."
					.formatted(parametros.recargaMinima(), parametros.recargaMaxima()));
		}
		String codigo = solicitud.operationCode();
		if (mongoTemplate.exists(Query.query(Criteria.where("referencia_proveedor").is(codigo)), Pago.class)) {
			throw codigoUsado();
		}

		Instant ahora = Instant.now();
		int creditos = soles * CREDITOS_POR_SOL;
		Pago pago = Pago.builder()
				.id(new ObjectId())
				.usuarioId(usuarioId)
				.montoCentimos(soles * 100)
				.creditos(creditos)
				.creditosPorSol(CREDITOS_POR_SOL)
				.metodo(Pago.YAPE)
				.proveedor(Pago.SIMULADO)
				.referenciaProveedor(codigo)
				.estado(Pago.APROBADO)
				.fechaCreacion(ahora)
				.build();
		try {
			int saldo = enTransaccion(() -> {
				mongoTemplate.insert(pago);
				return libroCreditos.registrar(Asiento.builder()
						.usuarioId(usuarioId)
						.tipo(TipoMovimiento.RECARGA)
						.monto(creditos)
						.descripcion("Operación " + codigo)
						.pagoId(pago.id())
						.fecha(ahora)
						.build()).orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
			});
			return new RecargaDto(creditos, saldo, codigo, ahora);
		} catch (DuplicateKeyException ex) {
			// Dos recargas simultáneas con el mismo código: el índice único rechaza la segunda.
			throw codigoUsado();
		}
	}

	// ------------------------------------------------------------------- Retiro

	/** RN-42: crea el retiro PENDIENTE y el movimiento RETIRO, que descuenta el saldo, en una transacción. */
	public RetiroDto retirar(ObjectId usuarioId, RetirarRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		if (!esConductor(usuario)) {
			throw new ApiException(CodigoError.DRIVER_ROLE_REQUIRED, "Solo los conductores pueden retirar créditos");
		}
		Parametros parametros = parametrosService.leer();
		int creditos = solicitud.amount();
		if (creditos < parametros.retiroMinimo()) {
			throw new ValidacionException("amount",
					"El retiro mínimo es de %d créditos.".formatted(parametros.retiroMinimo()));
		}
		if (retiroPendiente(usuarioId) != null) {
			throw retiroPendienteExiste();
		}
		int retirable = retirable(usuarioId, LibroCreditos.valor(usuario.getSaldoCreditos()));
		if (creditos > retirable) {
			throw excedeRetirable(retirable);
		}

		Instant ahora = Instant.now();
		Retiro retiro = Retiro.builder()
				.id(new ObjectId())
				.usuarioId(usuarioId)
				.creditos(creditos)
				.celularYape(solicitud.yapePhone())
				.estado(EstadoRetiro.PENDIENTE)
				.reversionAplicada(false)
				.fechaSolicitud(ahora)
				.build();
		try {
			int saldo = enTransaccion(() -> {
				mongoTemplate.insert(retiro);
				return libroCreditos.registrar(Asiento.builder()
						.usuarioId(usuarioId)
						.tipo(TipoMovimiento.RETIRO)
						.monto(-creditos)
						.descripcion("Celular •••• " + Retiro.ultimosTres(retiro.celularYape()))
						.retiroId(retiro.id())
						.fecha(ahora)
						.build()).orElseThrow(() -> excedeRetirable(retirable));
			});
			return new RetiroDto(retiro.id().toHexString(), creditos, Retiro.ultimosTres(retiro.celularYape()),
					EstadoRetiro.PENDIENTE.getApi(), ahora, saldo);
		} catch (DuplicateKeyException ex) {
			// Dos solicitudes simultáneas: el índice único parcial deja un solo retiro PENDIENTE.
			throw retiroPendienteExiste();
		}
	}

	/**
	 * RN-42: devuelve los créditos de cada retiro RECHAZADO que aún no se revirtió (movimiento REVERSION_RETIRO) y
	 * notifica al conductor en la misma transacción (RN-32).
	 * Lo llama el job cada minuto. Devuelve cuántos revirtió.
	 */
	public int revertirRechazados() {
		List<Retiro> rechazados = mongoTemplate.find(Query.query(Criteria.where("estado").is(EstadoRetiro.RECHAZADO)
				.and("reversion_aplicada").ne(true)), Retiro.class);
		int revertidos = 0;
		for (Retiro retiro : rechazados) {
			Instant ahora = Instant.now();
			boolean aplicado = enTransaccion(() -> {
				Query sinRevertir = Query.query(Criteria.where("_id").is(retiro.id())
						.and("estado").is(EstadoRetiro.RECHAZADO).and("reversion_aplicada").ne(true));
				if (mongoTemplate.updateFirst(sinRevertir, new Update().set("reversion_aplicada", true),
						Retiro.class).getModifiedCount() == 0) {
					return false;
				}
				String motivo = retiro.motivoRechazo() == null || retiro.motivoRechazo().isBlank()
						? "Celular •••• " + Retiro.ultimosTres(retiro.celularYape())
						: "Rechazado: " + retiro.motivoRechazo().strip();
				libroCreditos.registrar(Asiento.builder()
						.usuarioId(retiro.usuarioId())
						.tipo(TipoMovimiento.REVERSION_RETIRO)
						.monto(retiro.creditos())
						.descripcion(motivo)
						.retiroId(retiro.id())
						.fecha(ahora)
						.build()).orElseThrow();
				notificador.retiroRechazado(retiro, ahora);
				return true;
			});
			if (aplicado) {
				revertidos++;
			}
		}
		return revertidos;
	}

	// ------------------------------------------------------------------- Apoyo

	/** RN-42: mín(saldo disponible, Σ COBRO_VIAJE − Σ retiros no rechazados), nunca negativo. */
	int retirable(ObjectId usuarioId, int disponible) {
		int cobrado = sumar("movimientos_creditos", Criteria.where("usuario_id").is(usuarioId)
				.and("tipo").is(TipoMovimiento.COBRO_VIAJE.name()), "monto");
		int retirado = sumar("retiros", Criteria.where("usuario_id").is(usuarioId)
				.and("estado").ne(EstadoRetiro.RECHAZADO.name()), "creditos");
		return Math.max(0, Math.min(disponible, cobrado - retirado));
	}

	private int sumar(String coleccion, Criteria filtro, String campo) {
		Aggregation suma = Aggregation.newAggregation(Aggregation.match(filtro),
				Aggregation.group().sum(campo).as("total"));
		Document resultado = mongoTemplate.aggregate(suma, coleccion, Document.class).getUniqueMappedResult();
		return resultado != null && resultado.get("total") instanceof Number total ? total.intValue() : 0;
	}

	private Retiro retiroPendiente(ObjectId usuarioId) {
		return mongoTemplate.findOne(Query.query(Criteria.where("usuario_id").is(usuarioId)
				.and("estado").is(EstadoRetiro.PENDIENTE)), Retiro.class);
	}

	private static boolean esConductor(Usuario usuario) {
		return usuario.getRoles() != null && usuario.getRoles().contains(Rol.CONDUCTOR);
	}

	private static ApiException codigoUsado() {
		return new ApiException(CodigoError.OPERATION_CODE_ALREADY_USED, MENSAJE_CODIGO_USADO);
	}

	private static ApiException retiroPendienteExiste() {
		return new ApiException(CodigoError.WITHDRAWAL_PENDING, MENSAJE_RETIRO_PENDIENTE);
	}

	private static ValidacionException excedeRetirable(int retirable) {
		return new ValidacionException("amount",
				"Solo puedes retirar hasta %d créditos (lo que ganaste como conductor)".formatted(retirable));
	}

	private <T> T enTransaccion(Supplier<T> cambios) {
		TransactionTemplate transaccion = new TransactionTemplate(transactionManager);
		for (int intento = 1;; intento++) {
			try {
				return transaccion.execute(estado -> cambios.get());
			} catch (TransientDataAccessException ex) {
				if (intento == INTENTOS) {
					throw ex;
				}
			}
		}
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
