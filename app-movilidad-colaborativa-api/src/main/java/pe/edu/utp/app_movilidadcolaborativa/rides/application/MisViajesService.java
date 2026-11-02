package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ContadorCancelacionesDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisReservasDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisReservasDto.ReservaPropiaDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisViajesConductorDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisViajesConductorDto.PasajeroDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisViajesConductorDto.ViajePropioDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Actor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ReservaRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Mis viajes (RF-06, RF-07): la reserva activa del pasajero y los viajes del conductor, la cancelación de cada uno
 * (RN-25, RN-26), y el inicio y el fin del viaje (RN-43, RN-45, RN-46). Cada cambio de estado es un update
 * condicionado al estado actual, dentro de una transacción. La billetera y las notificaciones todavía no existen:
 * los créditos devueltos o cobrados solo se informan.
 */
@Service
@RequiredArgsConstructor
public class MisViajesService {

	/** RF-06: las reservas que le cancelaron al pasajero se ven durante 24 h. */
	static final Duration CANCELADAS_VISIBLES = Duration.ofHours(24);
	private static final int INTENTOS = 3;
	private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm").withZone(ReglasViaje.ZONA_PERU);
	private static final List<EstadoReserva> RESERVAS_DEL_VIAJE =
			List.of(EstadoReserva.CONFIRMADA, EstadoReserva.EN_VIAJE, EstadoReserva.NO_SE_PRESENTO);

	private final UsuarioRepository usuarioRepository;
	private final ViajeRepository viajeRepository;
	private final ReservaRepository reservaRepository;
	private final MongoTemplate mongoTemplate;
	private final PlatformTransactionManager transactionManager;
	private final ParametrosService parametrosService;
	private final RestriccionesPasajeroService restriccionesPasajeroService;
	private final CancelacionesConductorService cancelacionesConductorService;

	// ------------------------------------------------------------------ Pasajero

	public MisReservasDto reservasPropias(ObjectId usuarioId) {
		buscarUsuario(usuarioId);
		Instant ahora = Instant.now();
		int limite = parametrosService.leer().minutosLimiteCancelacion();

		ReservaPropiaDto activa = restriccionesPasajeroService.reservaActiva(usuarioId)
				.flatMap(reserva -> viajeRepository.findById(reserva.viajeId())
						.map(viaje -> ReservaPropiaDto.desde(reserva, viaje, limite)))
				.orElse(null);

		Query consulta = Query.query(Criteria.where("pasajero.id").is(usuarioId)
						.and("estado").is(EstadoReserva.CANCELADA)
						.and("cancelada_por").in(Actor.CONDUCTOR.name(), Actor.SISTEMA.name())
						.and("fecha_cancelacion").gte(ahora.minus(CANCELADAS_VISIBLES)))
				.with(Sort.by(Sort.Direction.DESC, "fecha_cancelacion"));
		List<Reserva> canceladas = mongoTemplate.find(consulta, Reserva.class);
		Map<ObjectId, Viaje> viajes = porId(viajeRepository.findAllById(
				canceladas.stream().map(Reserva::viajeId).toList()), Viaje::id);

		return new MisReservasDto(activa,
				canceladas.stream().filter(reserva -> viajes.containsKey(reserva.viajeId()))
						.map(reserva -> ReservaPropiaDto.desde(reserva, viajes.get(reserva.viajeId()), limite))
						.toList(),
				ContadorCancelacionesDto.desde(restriccionesPasajeroService.contador(usuarioId, ahora)));
	}

	/** RN-25: devuelve los créditos que se reembolsan (el 100 % de lo retenido). */
	public int cancelarReserva(ObjectId usuarioId, ObjectId reservaId) {
		buscarUsuario(usuarioId);
		Reserva reserva = reservaRepository.findById(reservaId)
				.filter(encontrada -> usuarioId.equals(encontrada.pasajero().id()))
				.orElseThrow(() -> new ApiException(CodigoError.BOOKING_NOT_FOUND, "Reserva no encontrada"));
		if (reserva.estado() != EstadoReserva.CONFIRMADA) {
			throw new ApiException(CodigoError.INVALID_STATUS, "Esta reserva ya no está confirmada");
		}
		int limite = parametrosService.leer().minutosLimiteCancelacion();
		Instant ahora = Instant.now();
		if (ahora.isAfter(reserva.viaje().fechaSalida().minus(Duration.ofMinutes(limite)))) {
			throw new ApiException(CodigoError.CANCELLATION_DEADLINE_PASSED, fueraDePlazo(limite));
		}

		enTransaccion(() -> {
			Query confirmada = Query.query(Criteria.where("_id").is(reservaId).and("estado").is(EstadoReserva.CONFIRMADA));
			Update cancelacion = new Update()
					.set("estado", EstadoReserva.CANCELADA.name())
					.set("cancelada_por", Actor.PASAJERO.name())
					.set("fecha_cancelacion", ahora)
					.set("fecha_actualizacion", ahora);
			if (mongoTemplate.updateFirst(confirmada, cancelacion, Reserva.class).getModifiedCount() == 0) {
				throw new ApiException(CodigoError.INVALID_STATUS, "Esta reserva ya no está confirmada");
			}
			// Las plazas vuelven al viaje.
			mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(reserva.viajeId())
							.and("estado").is(EstadoViaje.PUBLICADO)),
					new Update().inc("plazas_disponibles", reserva.plazas()).set("fecha_actualizacion", ahora),
					Viaje.class);
		});
		return reserva.totalCreditos();
	}

	// ----------------------------------------------------------------- Conductor

	/** Viajes PUBLICADO y EN_CURSO: el que está en curso primero y luego por hora de salida (RF-06). */
	public MisViajesConductorDto viajesPropios(ObjectId usuarioId) {
		buscarUsuario(usuarioId);
		Instant ahora = Instant.now();
		Parametros parametros = parametrosService.leer();

		Query consulta = Query.query(Criteria.where("conductor.id").is(usuarioId)
				.and("estado").in(EstadoViaje.PUBLICADO, EstadoViaje.EN_CURSO))
				.with(Sort.by(Sort.Direction.ASC, "fecha_salida"));
		List<Viaje> viajes = mongoTemplate.find(consulta, Viaje.class).stream()
				.sorted(Comparator.comparing((Viaje viaje) -> viaje.estado() != EstadoViaje.EN_CURSO))
				.toList();

		Map<ObjectId, List<Reserva>> reservasPorViaje = viajes.isEmpty() ? Map.of()
				: mongoTemplate.find(Query.query(Criteria.where("viaje_id").in(viajes.stream().map(Viaje::id).toList())
										.and("estado").in(RESERVAS_DEL_VIAJE))
								.with(Sort.by(Sort.Direction.ASC, "fecha_creacion")), Reserva.class)
						.stream().collect(Collectors.groupingBy(Reserva::viajeId));
		// La calificación y la foto de cada pasajero salen de su perfil actual.
		Map<ObjectId, Usuario> pasajeros = porId(usuarioRepository.findAllById(reservasPorViaje.values().stream()
				.flatMap(List::stream).map(reserva -> reserva.pasajero().id()).distinct().toList()), Usuario::getId);

		List<ViajePropioDto> data = viajes.stream().map(viaje -> new ViajePropioDto(
						ViajeResumenDto.desde(viaje),
						reservasPorViaje.getOrDefault(viaje.id(), List.of()).stream()
								.map(reserva -> PasajeroDto.desde(reserva, pasajeros.get(reserva.pasajero().id())))
								.toList(),
						viaje.fechaSalida().minus(Duration.ofMinutes(parametros.minutosLimiteCancelacion())),
						viaje.fechaSalida().minus(Duration.ofMinutes(parametros.minutosInicioAnticipado())),
						viaje.fechaSalida().plus(Duration.ofMinutes(parametros.minutosToleranciaInicio()))))
				.toList();
		return new MisViajesConductorDto(data,
				ContadorCancelacionesDto.desde(cancelacionesConductorService.contador(usuarioId, ahora)));
	}

	/** RN-26: el viaje y sus reservas CONFIRMADA pasan a cancelados, con reembolso del 100 %. */
	public void cancelarViaje(ObjectId usuarioId, ObjectId viajeId, String motivo) {
		Viaje viaje = viajePropio(usuarioId, viajeId);
		exigirEstado(viaje, EstadoViaje.PUBLICADO, "Este viaje ya no está publicado");
		int limite = parametrosService.leer().minutosLimiteCancelacion();
		Instant ahora = Instant.now();
		if (ahora.isAfter(viaje.fechaSalida().minus(Duration.ofMinutes(limite)))) {
			throw new ApiException(CodigoError.CANCELLATION_DEADLINE_PASSED, fueraDePlazo(limite)
					+ ". Si no puedes hacer el viaje, no lo inicies y se cancelará solo.");
		}

		enTransaccion(() -> {
			cambiarEstado(viaje, EstadoViaje.PUBLICADO, new Update()
					.set("estado", EstadoViaje.CANCELADO.name())
					.set("cancelado_por", Actor.CONDUCTOR.name())
					.set("motivo_cancelacion", motivo)
					.set("fecha_cancelacion", ahora)
					.set("fecha_actualizacion", ahora), "Este viaje ya no está publicado");
			mongoTemplate.updateMulti(Query.query(Criteria.where("viaje_id").is(viajeId)
							.and("estado").is(EstadoReserva.CONFIRMADA)),
					new Update()
							.set("estado", EstadoReserva.CANCELADA.name())
							.set("cancelada_por", Actor.CONDUCTOR.name())
							.set("fecha_cancelacion", ahora)
							.set("fecha_actualizacion", ahora),
					Reserva.class);
		});
	}

	/**
	 * RN-43 y RN-46: inicia el viaje dentro de su ventana. Las reservas de abordados pasan a EN_VIAJE y el resto de
	 * las CONFIRMADA a NO_SE_PRESENTO.
	 */
	public void iniciar(ObjectId usuarioId, ObjectId viajeId, List<String> abordados) {
		Viaje viaje = viajePropio(usuarioId, viajeId);
		exigirEstado(viaje, EstadoViaje.PUBLICADO, "Este viaje ya no está publicado");
		Parametros parametros = parametrosService.leer();
		Instant ahora = Instant.now();
		Instant desde = viaje.fechaSalida().minus(Duration.ofMinutes(parametros.minutosInicioAnticipado()));
		if (ahora.isBefore(desde)) {
			throw new ApiException(CodigoError.START_WINDOW_CLOSED,
					"Podrás iniciar el viaje desde las " + HORA.format(desde));
		}
		if (ahora.isAfter(viaje.fechaSalida().plus(Duration.ofMinutes(parametros.minutosToleranciaInicio())))) {
			throw new ApiException(CodigoError.START_WINDOW_CLOSED, "Ya pasó el plazo para iniciar este viaje");
		}
		if (mongoTemplate.exists(Query.query(Criteria.where("conductor.id").is(usuarioId)
				.and("estado").is(EstadoViaje.EN_CURSO)), Viaje.class)) {
			throw new ApiException(CodigoError.RIDE_IN_PROGRESS_EXISTS, "Finaliza tu viaje en curso para iniciar este.");
		}
		Set<ObjectId> confirmadas = mongoTemplate.find(Query.query(Criteria.where("viaje_id").is(viajeId)
						.and("estado").is(EstadoReserva.CONFIRMADA)), Reserva.class).stream()
				.map(Reserva::id).collect(Collectors.toSet());
		Set<ObjectId> subieron = new HashSet<>(abordados.stream().map(ObjectId::new).toList());
		if (!confirmadas.containsAll(subieron)) {
			throw new ValidacionException("boardedBookingIds", "Hay reservas que no pertenecen a este viaje");
		}

		enTransaccion(() -> {
			cambiarEstado(viaje, EstadoViaje.PUBLICADO, new Update()
					.set("estado", EstadoViaje.EN_CURSO.name())
					.set("fecha_inicio", ahora)
					.set("fecha_actualizacion", ahora), "Este viaje ya no está publicado");
			if (!subieron.isEmpty()) {
				mongoTemplate.updateMulti(Query.query(Criteria.where("_id").in(subieron)
								.and("estado").is(EstadoReserva.CONFIRMADA)),
						new Update().set("estado", EstadoReserva.EN_VIAJE.name()).set("fecha_actualizacion", ahora),
						Reserva.class);
			}
			mongoTemplate.updateMulti(Query.query(Criteria.where("viaje_id").is(viajeId)
							.and("estado").is(EstadoReserva.CONFIRMADA)),
					new Update().set("estado", EstadoReserva.NO_SE_PRESENTO.name()).set("fecha_actualizacion", ahora),
					Reserva.class);
		});
	}

	/** RN-45: el viaje pasa a COMPLETADO y las reservas EN_VIAJE a COMPLETADA. La liquidación (RN-40) queda pendiente. */
	public void finalizar(ObjectId usuarioId, ObjectId viajeId) {
		Viaje viaje = viajePropio(usuarioId, viajeId);
		exigirEstado(viaje, EstadoViaje.EN_CURSO, "Este viaje no está en curso");
		Instant ahora = Instant.now();

		enTransaccion(() -> {
			cambiarEstado(viaje, EstadoViaje.EN_CURSO, new Update()
					.set("estado", EstadoViaje.COMPLETADO.name())
					.set("finalizado_por", Actor.CONDUCTOR.name())
					.set("fecha_fin", ahora)
					.set("fecha_actualizacion", ahora), "Este viaje no está en curso");
			mongoTemplate.updateMulti(Query.query(Criteria.where("viaje_id").is(viajeId)
							.and("estado").is(EstadoReserva.EN_VIAJE)),
					new Update().set("estado", EstadoReserva.COMPLETADA.name()).set("fecha_actualizacion", ahora),
					Reserva.class);
		});
	}

	// ------------------------------------------------------------------ Apoyo

	private static String fueraDePlazo(int minutos) {
		return "Ya no puedes cancelar: faltan menos de %d minutos para la salida".formatted(minutos);
	}

	// Un viaje de otro conductor responde como inexistente.
	private Viaje viajePropio(ObjectId usuarioId, ObjectId viajeId) {
		buscarUsuario(usuarioId);
		return viajeRepository.findById(viajeId)
				.filter(viaje -> usuarioId.equals(viaje.conductor().id()))
				.orElseThrow(() -> new ApiException(CodigoError.RIDE_NOT_FOUND, "Viaje no encontrado"));
	}

	private static void exigirEstado(Viaje viaje, EstadoViaje estado, String mensaje) {
		if (viaje.estado() != estado) {
			throw new ApiException(CodigoError.INVALID_STATUS, mensaje);
		}
	}

	// Condicionado al estado leído: si otra operación lo cambió antes, no se toca nada.
	private void cambiarEstado(Viaje viaje, EstadoViaje estadoActual, Update cambio, String mensaje) {
		Query consulta = Query.query(Criteria.where("_id").is(viaje.id()).and("estado").is(estadoActual));
		if (mongoTemplate.updateFirst(consulta, cambio, Viaje.class).getModifiedCount() == 0) {
			throw new ApiException(CodigoError.INVALID_STATUS, mensaje);
		}
	}

	// Dos operaciones simultáneas sobre el mismo viaje chocan dentro de la transacción: se reintenta.
	private void enTransaccion(Runnable cambios) {
		TransactionTemplate transaccion = new TransactionTemplate(transactionManager);
		for (int intento = 1;; intento++) {
			try {
				transaccion.executeWithoutResult(estado -> cambios.run());
				return;
			} catch (TransientDataAccessException ex) {
				if (intento == INTENTOS) {
					throw ex;
				}
			}
		}
	}

	private static <T> Map<ObjectId, T> porId(Iterable<T> elementos, Function<T, ObjectId> id) {
		Map<ObjectId, T> mapa = new HashMap<>();
		elementos.forEach(elemento -> mapa.put(id.apply(elemento), elemento));
		return mapa;
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
