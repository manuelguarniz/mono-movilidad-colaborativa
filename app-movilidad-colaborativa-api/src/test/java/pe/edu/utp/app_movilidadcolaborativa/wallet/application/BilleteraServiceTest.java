package pe.edu.utp.app_movilidadcolaborativa.wallet.application;

import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.transaction.PlatformTransactionManager;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.RestriccionesPasajeroService;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.ResumenViaje;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;
import pe.edu.utp.app_movilidadcolaborativa.wallet.application.LibroCreditos.Asiento;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.BilleteraDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RecargaDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RecargarRequest;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RetirarRequest;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RetiroDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.EstadoRetiro;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.Pago;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.Retiro;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.TipoMovimiento;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Billetera (RF-11, RF-12, RN-41, RN-42): saldos, recarga, retiro y reversión, sin base de datos. */
class BilleteraServiceTest {

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final PlatformTransactionManager transacciones = mock(PlatformTransactionManager.class);
	private final ParametrosService parametros = mock(ParametrosService.class);
	private final RestriccionesPasajeroService restricciones = mock(RestriccionesPasajeroService.class);
	private final LibroCreditos libro = mock(LibroCreditos.class);
	private final BilleteraService servicio = new BilleteraService(usuarioRepository, mongoTemplate, transacciones,
			parametros, restricciones, libro);
	private final ObjectId usuarioId = new ObjectId();

	{
		when(parametros.leer()).thenReturn(ParametrosService.Parametros.POR_DEFECTO);
		when(libro.registrar(any(Asiento.class))).thenReturn(OptionalInt.of(58));
	}

	private void existe(Rol modo, Integer saldo, Integer retenidos) {
		List<Rol> roles = modo == Rol.CONDUCTOR ? List.of(Rol.PASAJERO, Rol.CONDUCTOR) : List.of(Rol.PASAJERO);
		when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(Usuario.builder().id(usuarioId)
				.estado(EstadoUsuario.ACTIVO).roles(roles).modoActivo(modo)
				.saldoCreditos(saldo).creditosRetenidos(retenidos).build()));
	}

	private void suma(String coleccion, int total) {
		when(mongoTemplate.aggregate(any(Aggregation.class), eq(coleccion), eq(Document.class)))
				.thenReturn(new AggregationResults<>(List.of(new Document("total", total)), new Document()));
	}

	/** Carlos: 128 cobrados y 50 retirados. */
	private void ganancias(int cobrado, int retirado) {
		suma("movimientos_creditos", cobrado);
		suma("retiros", retirado);
	}

	private static void invalido(Runnable accion, String mensaje) {
		assertThatThrownBy(accion::run).isInstanceOfSatisfying(ValidacionException.class, ex -> {
			assertThat(ex.getErrores().getFirst().field()).isEqualTo("amount");
			assertThat(ex.getMessage()).isEqualTo(mensaje);
		});
	}

	private static void falla(Runnable accion, CodigoError codigo, String mensaje) {
		assertThatThrownBy(accion::run).isInstanceOfSatisfying(ApiException.class, ex -> {
			assertThat(ex.getCodigo()).isEqualTo(codigo);
			assertThat(ex.getMessage()).isEqualTo(mensaje);
		});
	}

	private Asiento asiento() {
		ArgumentCaptor<Asiento> asiento = ArgumentCaptor.forClass(Asiento.class);
		verify(libro).registrar(asiento.capture());
		return asiento.getValue();
	}

	// ------------------------------------------------------------------ Consulta

	@Test
	void elConductorVeSuSaldoRetirableComoMinimoEntreDisponibleYGanado() {
		existe(Rol.CONDUCTOR, 96, 0);
		ganancias(128, 50);

		BilleteraDto billetera = servicio.consultar(usuarioId);

		assertThat(billetera.available()).isEqualTo(96);
		assertThat(billetera.held()).isZero();
		assertThat(billetera.withdrawable()).isEqualTo(78);
		assertThat(billetera.activeMode()).isEqualTo("DRIVER");
		assertThat(billetera.driver()).isTrue();
		assertThat(billetera.limits()).isEqualTo(new BilleteraDto.LimitesDto(5, 200, 10));

		// Tras retirar 50 más: mín(46, 128 − 100) = 28 (21-F).
		existe(Rol.CONDUCTOR, 46, 0);
		ganancias(128, 100);
		assertThat(servicio.consultar(usuarioId).withdrawable()).isEqualTo(28);
	}

	@Test
	void elPasajeroVeLaReservaQueExplicaSuRetenido() {
		existe(Rol.PASAJERO, null, 12);
		ganancias(0, 0);
		Instant salida = Instant.parse("2026-11-21T19:20:00Z");
		Reserva activa = Reserva.builder().id(new ObjectId()).viajeId(new ObjectId())
				.pasajero(new ReferenciaNombre(usuarioId, "Lucía R."))
				.viaje(new ResumenViaje("Campus UTP Trujillo", "Urb. El Golf", salida, "Carlos M.", null))
				.plazas(2).totalCreditos(12).estado(EstadoReserva.CONFIRMADA).liquidada(false).build();
		when(restricciones.reservaActiva(usuarioId)).thenReturn(Optional.of(activa));

		BilleteraDto billetera = servicio.consultar(usuarioId);

		assertThat(billetera.available()).isZero();
		assertThat(billetera.held()).isEqualTo(12);
		assertThat(billetera.withdrawable()).isZero();
		assertThat(billetera.activeMode()).isEqualTo("PASSENGER");
		assertThat(billetera.heldBooking().departureTime()).isEqualTo(salida);
		assertThat(billetera.heldBooking().credits()).isEqualTo(12);
	}

	// ------------------------------------------------------------------- Recarga

	@Test
	void recargarCreaElPagoYAcreditaUnCreditoPorSol() {
		existe(Rol.PASAJERO, 38, 12);

		RecargaDto recarga = servicio.recargar(usuarioId, new RecargarRequest(20, "08451236"));

		assertThat(recarga.credits()).isEqualTo(20);
		assertThat(recarga.balance()).isEqualTo(58);
		ArgumentCaptor<Pago> pago = ArgumentCaptor.forClass(Pago.class);
		verify(mongoTemplate).insert(pago.capture());
		assertThat(pago.getValue().montoCentimos()).isEqualTo(2000);
		assertThat(pago.getValue().estado()).isEqualTo("APROBADO");
		assertThat(pago.getValue().proveedor()).isEqualTo("SIMULADO");
		assertThat(pago.getValue().referenciaProveedor()).isEqualTo("08451236");
		Asiento asiento = asiento();
		assertThat(asiento.tipo()).isEqualTo(TipoMovimiento.RECARGA);
		assertThat(asiento.monto()).isEqualTo(20);
		assertThat(asiento.descripcion()).isEqualTo("Operación 08451236");
		assertThat(asiento.pagoId()).isEqualTo(pago.getValue().id());
		verify(transacciones).commit(any());
	}

	@Test
	void laRecargaRespetaElRangoYUnCodigoNoUsado() {
		existe(Rol.PASAJERO, 0, 0);
		invalido(() -> servicio.recargar(usuarioId, new RecargarRequest(4, "08451236")),
				"Elige un monto entre S/ 5 y S/ 200.");
		invalido(() -> servicio.recargar(usuarioId, new RecargarRequest(201, "08451236")),
				"Elige un monto entre S/ 5 y S/ 200.");

		when(mongoTemplate.exists(any(Query.class), eq(Pago.class))).thenReturn(true);
		falla(() -> servicio.recargar(usuarioId, new RecargarRequest(20, "08451236")),
				CodigoError.OPERATION_CODE_ALREADY_USED, "Este código de operación ya fue registrado");

		// Dos recargas simultáneas con el mismo código: responde el índice único.
		when(mongoTemplate.exists(any(Query.class), eq(Pago.class))).thenReturn(false);
		when(mongoTemplate.insert(any(Pago.class))).thenThrow(new DuplicateKeyException("pagos"));
		falla(() -> servicio.recargar(usuarioId, new RecargarRequest(20, "08451236")),
				CodigoError.OPERATION_CODE_ALREADY_USED, "Este código de operación ya fue registrado");
		verify(libro, never()).registrar(any(Asiento.class));
	}

	// -------------------------------------------------------------------- Retiro

	@Test
	void retirarCreaElRetiroPendienteYDescuentaElSaldo() {
		existe(Rol.CONDUCTOR, 96, 0);
		ganancias(128, 50);
		when(libro.registrar(any(Asiento.class))).thenReturn(OptionalInt.of(46));

		RetiroDto retiro = servicio.retirar(usuarioId, new RetirarRequest(50, "987654321"));

		assertThat(retiro.status()).isEqualTo("PENDING");
		assertThat(retiro.balance()).isEqualTo(46);
		assertThat(retiro.phoneLast3()).isEqualTo("321");
		ArgumentCaptor<Retiro> guardado = ArgumentCaptor.forClass(Retiro.class);
		verify(mongoTemplate).insert(guardado.capture());
		assertThat(guardado.getValue().estado()).isEqualTo(EstadoRetiro.PENDIENTE);
		assertThat(guardado.getValue().creditos()).isEqualTo(50);
		Asiento asiento = asiento();
		assertThat(asiento.tipo()).isEqualTo(TipoMovimiento.RETIRO);
		assertThat(asiento.monto()).isEqualTo(-50);
		assertThat(asiento.descripcion()).isEqualTo("Celular •••• 321");
	}

	@Test
	void elRetiroEsDelConductorDesdeElMinimoHastaLoRetirableYUnoALaVez() {
		existe(Rol.PASAJERO, 96, 0);
		falla(() -> servicio.retirar(usuarioId, new RetirarRequest(50, "987654321")),
				CodigoError.DRIVER_ROLE_REQUIRED, "Solo los conductores pueden retirar créditos");

		existe(Rol.CONDUCTOR, 96, 0);
		ganancias(128, 50);
		invalido(() -> servicio.retirar(usuarioId, new RetirarRequest(9, "987654321")),
				"El retiro mínimo es de 10 créditos.");
		invalido(() -> servicio.retirar(usuarioId, new RetirarRequest(79, "987654321")),
				"Solo puedes retirar hasta 78 créditos (lo que ganaste como conductor)");

		when(mongoTemplate.findOne(any(Query.class), eq(Retiro.class)))
				.thenReturn(Retiro.builder().id(new ObjectId()).estado(EstadoRetiro.PENDIENTE).build());
		falla(() -> servicio.retirar(usuarioId, new RetirarRequest(50, "987654321")),
				CodigoError.WITHDRAWAL_PENDING, "Ya tienes un retiro pendiente");
		verify(mongoTemplate, never()).insert(any(Retiro.class));
	}

	@Test
	void unRetiroRechazadoDevuelveSusCreditosUnaSolaVez() {
		Retiro rechazado = Retiro.builder().id(new ObjectId()).usuarioId(usuarioId).creditos(50)
				.celularYape("987654321").estado(EstadoRetiro.RECHAZADO).motivoRechazo("Número sin Yape").build();
		when(mongoTemplate.find(any(Query.class), eq(Retiro.class))).thenReturn(List.of(rechazado));
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Retiro.class)))
				.thenReturn(UpdateResult.acknowledged(1, 1L, null));

		assertThat(servicio.revertirRechazados()).isEqualTo(1);

		Asiento asiento = asiento();
		assertThat(asiento.tipo()).isEqualTo(TipoMovimiento.REVERSION_RETIRO);
		assertThat(asiento.monto()).isEqualTo(50);
		assertThat(asiento.retiroId()).isEqualTo(rechazado.id());
		assertThat(asiento.descripcion()).isEqualTo("Rechazado: Número sin Yape");

		// Otra ejecución ya lo revirtió: no se abona de nuevo.
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Retiro.class)))
				.thenReturn(UpdateResult.acknowledged(0, 0L, null));
		assertThat(servicio.revertirRechazados()).isZero();
	}
}
