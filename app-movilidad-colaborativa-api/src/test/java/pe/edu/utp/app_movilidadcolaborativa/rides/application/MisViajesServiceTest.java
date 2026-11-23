package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import pe.edu.utp.app_movilidadcolaborativa.notifications.application.Notificador;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.transaction.PlatformTransactionManager;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.CancelacionesConductorService.Contador;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisReservasDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisViajesConductorDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.ResumenViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ReservaRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;
import pe.edu.utp.app_movilidadcolaborativa.wallet.application.LibroCreditos;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Actor;

import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoAsistencia;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Mis viajes (RF-06, RF-07): cancelar, iniciar y finalizar, sin base de datos. */
class MisViajesServiceTest {

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final ViajeRepository viajeRepository = mock(ViajeRepository.class);
	private final ReservaRepository reservaRepository = mock(ReservaRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final PlatformTransactionManager transacciones = mock(PlatformTransactionManager.class);
	private final ParametrosService parametros = mock(ParametrosService.class);
	private final RestriccionesPasajeroService restricciones = mock(RestriccionesPasajeroService.class);
	private final CancelacionesConductorService cancelaciones = mock(CancelacionesConductorService.class);
	private final LibroCreditos libro = mock(LibroCreditos.class);
	private final Notificador notificador = mock(Notificador.class);
	private final MisViajesService servicio = new MisViajesService(usuarioRepository, viajeRepository,
			reservaRepository, mongoTemplate, transacciones, parametros, restricciones, cancelaciones, libro, notificador);
	private final ObjectId usuarioId = new ObjectId();
	private final ObjectId viajeId = new ObjectId();

	{
		when(parametros.leer()).thenReturn(ParametrosService.Parametros.POR_DEFECTO);
		when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(Usuario.builder().id(usuarioId)
				.nombres("Carlos").apellidos("Mendoza").estado(EstadoUsuario.ACTIVO).build()));
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), any(Class.class)))
				.thenReturn(UpdateResult.acknowledged(1, 1L, null));
	}

	private static Instant enMinutos(long minutos) {
		return Instant.now().plus(minutos, ChronoUnit.MINUTES).truncatedTo(ChronoUnit.SECONDS);
	}

	private void existeViaje(EstadoViaje estado, Instant salida) {
		when(viajeRepository.findById(viajeId)).thenReturn(Optional.of(
				Viajes.publicado(viajeId, usuarioId).estado(estado).fechaSalida(salida).build()));
	}

	private Reserva reserva(ObjectId reservaId, ObjectId pasajeroId, EstadoReserva estado, Instant salida) {
		return Reserva.builder().id(reservaId).viajeId(viajeId)
				.pasajero(new ReferenciaNombre(pasajeroId, "Lucía R."))
				.viaje(new ResumenViaje("Campus UTP Trujillo", "Urb. El Golf", salida, "Carlos M.", null))
				.plazas(2).totalCreditos(12).estado(estado).fechaCreacion(Instant.now()).build();
	}

	private static void falla(Runnable accion, CodigoError codigo, String mensaje) {
		assertThatThrownBy(accion::run).isInstanceOfSatisfying(ApiException.class, ex -> {
			assertThat(ex.getCodigo()).isEqualTo(codigo);
			assertThat(ex.getMessage()).isEqualTo(mensaje);
		});
	}

	private Document actualizacion(Class<?> entidad) {
		ArgumentCaptor<Update> cambio = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(any(Query.class), cambio.capture(), eq(entidad));
		return cambio.getValue().getUpdateObject().get("$set", Document.class);
	}

	// --------------------------------------------------------------- Pasajero

	@Test
	void cancelarReservaDevuelveLasPlazasYLosCreditos() {
		ObjectId reservaId = new ObjectId();
		Reserva confirmada = reserva(reservaId, usuarioId, EstadoReserva.CONFIRMADA, enMinutos(60));
		when(reservaRepository.findById(reservaId)).thenReturn(Optional.of(confirmada));
		when(libro.reembolsar(eq(confirmada), eq(Actor.PASAJERO), any(Instant.class))).thenReturn(12);
		Viaje conPlazasDevueltas = Viajes.publicado(viajeId, new ObjectId()).plazasDisponibles(3).build();
		when(mongoTemplate.findById(viajeId, Viaje.class)).thenReturn(conPlazasDevueltas);

		assertThat(servicio.cancelarReserva(usuarioId, reservaId)).isEqualTo(12);
		verify(notificador).reservaCancelada(eq(conPlazasDevueltas), eq(confirmada), any(Instant.class));
		verify(libro).reembolsar(eq(confirmada), eq(Actor.PASAJERO), any(Instant.class));

		assertThat(actualizacion(Reserva.class)).containsEntry("estado", "CANCELADA")
				.containsEntry("cancelada_por", "PASAJERO").containsKey("fecha_cancelacion");
		ArgumentCaptor<Update> plazas = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(any(Query.class), plazas.capture(), eq(Viaje.class));
		assertThat(plazas.getValue().getUpdateObject().get("$inc", Document.class))
				.containsEntry("plazas_disponibles", 2);
	}

	@Test
	void cancelarReservaRespetaElPlazoYLaPropiedad() {
		ObjectId reservaId = new ObjectId();
		when(reservaRepository.findById(reservaId))
				.thenReturn(Optional.of(reserva(reservaId, usuarioId, EstadoReserva.CONFIRMADA, enMinutos(20))));
		falla(() -> servicio.cancelarReserva(usuarioId, reservaId), CodigoError.CANCELLATION_DEADLINE_PASSED,
				"Ya no puedes cancelar: faltan menos de 30 minutos para la salida");

		ObjectId ajena = new ObjectId();
		when(reservaRepository.findById(ajena))
				.thenReturn(Optional.of(reserva(ajena, new ObjectId(), EstadoReserva.CONFIRMADA, enMinutos(60))));
		falla(() -> servicio.cancelarReserva(usuarioId, ajena), CodigoError.BOOKING_NOT_FOUND, "Reserva no encontrada");

		ObjectId enViaje = new ObjectId();
		when(reservaRepository.findById(enViaje))
				.thenReturn(Optional.of(reserva(enViaje, usuarioId, EstadoReserva.EN_VIAJE, enMinutos(60))));
		falla(() -> servicio.cancelarReserva(usuarioId, enViaje), CodigoError.INVALID_STATUS,
				"Esta reserva ya no está confirmada");
		verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Reserva.class));
	}

	@Test
	void reservasPropiasTraeLaActivaYLasCanceladasPorElConductor() {
		ObjectId activaId = new ObjectId();
		Instant salida = Instant.parse("2030-01-15T19:20:00Z");
		when(restricciones.reservaActiva(usuarioId))
				.thenReturn(Optional.of(reserva(activaId, usuarioId, EstadoReserva.CONFIRMADA, salida)));
		existeViaje(EstadoViaje.PUBLICADO, salida);
		when(restricciones.contador(eq(usuarioId), any(Instant.class))).thenReturn(new Contador(2, 5, 30, null, null));

		MisReservasDto reservas = servicio.reservasPropias(usuarioId);

		assertThat(reservas.active().status()).isEqualTo("CONFIRMED");
		assertThat(reservas.active().cancellableUntil()).isEqualTo(Instant.parse("2030-01-15T18:50:00Z"));
		assertThat(reservas.active().ride().campus().city()).isEqualTo("Trujillo");
		assertThat(reservas.cancelled()).isEmpty();
		assertThat(reservas.cancellations().count()).isEqualTo(2);
		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(consulta.capture(), eq(Reserva.class));
		assertThat(consulta.getValue().getQueryObject()).containsEntry("estado", EstadoReserva.CANCELADA)
				.containsEntry("cancelada_por", new Document("$in", List.of("CONDUCTOR", "SISTEMA")));
	}

	// -------------------------------------------------------------- Conductor

	@Test
	void viajesPropiosPoneElViajeEnCursoPrimeroConSusPasajerosYPlazos() {
		Instant salida = Instant.parse("2030-01-15T19:20:00Z");
		Viaje publicado = Viajes.publicado(viajeId, usuarioId).fechaSalida(salida).build();
		Viaje enCurso = Viajes.publicado(new ObjectId(), usuarioId).estado(EstadoViaje.EN_CURSO)
				.fechaSalida(salida.plus(Duration.ofHours(1))).build();
		when(mongoTemplate.find(any(Query.class), eq(Viaje.class))).thenReturn(List.of(publicado, enCurso));
		ObjectId pasajeroId = new ObjectId();
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class)))
				.thenReturn(List.of(reserva(new ObjectId(), pasajeroId, EstadoReserva.CONFIRMADA, salida)));
		when(usuarioRepository.findAllById(anyIterable())).thenReturn(List.of(Usuario.builder().id(pasajeroId)
				.calificacion(new Calificacion(4.8, 20)).build()));
		when(cancelaciones.contador(eq(usuarioId), any(Instant.class)))
				.thenReturn(new Contador(9, 10, 30, null, Instant.parse("2030-02-01T00:00:00Z")));

		MisViajesConductorDto viajes = servicio.viajesPropios(usuarioId);

		assertThat(viajes.data()).extracting(viaje -> viaje.ride().status()).containsExactly("IN_PROGRESS", "PUBLISHED");
		MisViajesConductorDto.ViajePropioDto proximo = viajes.data().get(1);
		assertThat(proximo.passengers()).singleElement().satisfies(pasajero -> {
			assertThat(pasajero.name()).isEqualTo("Lucía R.");
			assertThat(pasajero.rating().average()).isEqualTo(4.8);
			assertThat(pasajero.status()).isEqualTo("CONFIRMED");
		});
		assertThat(proximo.cancellableUntil()).isEqualTo(Instant.parse("2030-01-15T18:50:00Z"));
		assertThat(proximo.startableFrom()).isEqualTo(Instant.parse("2030-01-15T19:05:00Z"));
		assertThat(proximo.startableUntil()).isEqualTo(Instant.parse("2030-01-15T19:50:00Z"));
		assertThat(viajes.cancellations().blockedUntilIfCancelled()).isEqualTo(Instant.parse("2030-02-01T00:00:00Z"));
	}

	@Test
	void elConductorVeLaAsistenciaCopiadaEnLaReserva() {
		Reserva reserva = Reserva.builder().id(new ObjectId()).viajeId(viajeId)
				.pasajero(new ReferenciaNombre(new ObjectId(), "Jorge P.")).plazas(1).totalCreditos(5)
				.asistencia(new Reserva.Asistencia(TipoAsistencia.SILLA_RUEDAS, "Silla plegable"))
				.estado(EstadoReserva.CONFIRMADA).build();

		assertThat(MisViajesConductorDto.PasajeroDto.desde(reserva, null).mobilityAssistance())
				.isEqualTo(new PerfilUsuarioDto.AsistenciaDto("WHEELCHAIR", "Silla plegable"));
		assertThat(MisViajesConductorDto.PasajeroDto.desde(Reserva.builder().id(new ObjectId()).viajeId(viajeId)
				.pasajero(new ReferenciaNombre(new ObjectId(), "Lucía R.")).estado(EstadoReserva.CONFIRMADA).build(), null)
				.mobilityAssistance()).isNull();
	}

	@Test
	void cancelarViajeCancelaSusReservasConfirmadas() {
		existeViaje(EstadoViaje.PUBLICADO, enMinutos(120));
		List<Reserva> confirmadas = List.of(
				reserva(new ObjectId(), new ObjectId(), EstadoReserva.CONFIRMADA, enMinutos(120)),
				reserva(new ObjectId(), new ObjectId(), EstadoReserva.CONFIRMADA, enMinutos(120)));
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class))).thenReturn(confirmadas);

		servicio.cancelarViaje(usuarioId, viajeId, "Emergencia mecánica");

		// RN-40: cada reserva cancelada recupera el 100 % de lo retenido.
		confirmadas.forEach(reserva -> verify(libro).reembolsar(eq(reserva), eq(Actor.CONDUCTOR), any(Instant.class)));
		// RN-32: cada pasajero recibe «Viaje cancelado» con el motivo.
		confirmadas.forEach(reserva -> verify(notificador).viajeCancelado(any(Viaje.class), eq(reserva), eq(0),
				eq("Emergencia mecánica"), eq(false), any(Instant.class)));

		assertThat(actualizacion(Viaje.class)).containsEntry("estado", "CANCELADO")
				.containsEntry("cancelado_por", "CONDUCTOR").containsEntry("motivo_cancelacion", "Emergencia mecánica");
		ArgumentCaptor<Update> reservas = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateMulti(any(Query.class), reservas.capture(), eq(Reserva.class));
		assertThat(reservas.getValue().getUpdateObject().get("$set", Document.class))
				.containsEntry("estado", "CANCELADA").containsEntry("cancelada_por", "CONDUCTOR");
	}

	@Test
	void cancelarViajeRespetaElPlazoElEstadoYElConductor() {
		existeViaje(EstadoViaje.PUBLICADO, enMinutos(10));
		falla(() -> servicio.cancelarViaje(usuarioId, viajeId, null), CodigoError.CANCELLATION_DEADLINE_PASSED,
				"Ya no puedes cancelar: faltan menos de 30 minutos para la salida. Si no puedes hacer el viaje, "
						+ "no lo inicies y se cancelará solo.");

		existeViaje(EstadoViaje.EN_CURSO, enMinutos(120));
		falla(() -> servicio.cancelarViaje(usuarioId, viajeId, null), CodigoError.INVALID_STATUS,
				"Este viaje ya no está publicado");

		when(viajeRepository.findById(viajeId))
				.thenReturn(Optional.of(Viajes.publicado(viajeId, new ObjectId()).fechaSalida(enMinutos(120)).build()));
		falla(() -> servicio.cancelarViaje(usuarioId, viajeId, null), CodigoError.RIDE_NOT_FOUND, "Viaje no encontrado");
		verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Viaje.class));
	}

	@Test
	void iniciarMarcaQuienesSubieronYQuienesNo() {
		existeViaje(EstadoViaje.PUBLICADO, enMinutos(5));
		ObjectId subio = new ObjectId();
		ObjectId noSubio = new ObjectId();
		Reserva aBordo = reserva(subio, new ObjectId(), EstadoReserva.CONFIRMADA, enMinutos(5));
		Reserva ausente = reserva(noSubio, new ObjectId(), EstadoReserva.CONFIRMADA, enMinutos(5));
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class))).thenReturn(List.of(aBordo, ausente));

		servicio.iniciar(usuarioId, viajeId, List.of(subio.toHexString()));

		verify(notificador).viajeIniciado(any(Viaje.class), eq(aBordo), any(Instant.class));
		verify(notificador).noSePresento(any(Viaje.class), eq(ausente), any(Instant.class));
		verify(notificador, never()).viajeIniciado(any(Viaje.class), eq(ausente), any(Instant.class));

		assertThat(actualizacion(Viaje.class)).containsEntry("estado", "EN_CURSO").containsKey("fecha_inicio");
		ArgumentCaptor<Query> consultas = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> cambios = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate, org.mockito.Mockito.times(2))
				.updateMulti(consultas.capture(), cambios.capture(), eq(Reserva.class));
		assertThat(cambios.getAllValues()).extracting(cambio -> cambio.getUpdateObject().get("$set", Document.class)
				.getString("estado")).containsExactly("EN_VIAJE", "NO_SE_PRESENTO");
	}

	@Test
	void iniciarRespetaLaVentanaUnSoloViajeEnCursoYLasReservasDelViaje() {
		existeViaje(EstadoViaje.PUBLICADO, Instant.parse("2030-01-15T19:20:00Z"));
		falla(() -> servicio.iniciar(usuarioId, viajeId, List.of()), CodigoError.START_WINDOW_CLOSED,
				"Podrás iniciar el viaje desde las 14:05");

		existeViaje(EstadoViaje.PUBLICADO, enMinutos(-31));
		falla(() -> servicio.iniciar(usuarioId, viajeId, List.of()), CodigoError.START_WINDOW_CLOSED,
				"Ya pasó el plazo para iniciar este viaje");

		existeViaje(EstadoViaje.PUBLICADO, enMinutos(5));
		when(mongoTemplate.exists(any(Query.class), eq(Viaje.class))).thenReturn(true);
		falla(() -> servicio.iniciar(usuarioId, viajeId, List.of()), CodigoError.RIDE_IN_PROGRESS_EXISTS,
				"Finaliza tu viaje en curso para iniciar este.");

		when(mongoTemplate.exists(any(Query.class), eq(Viaje.class))).thenReturn(false);
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class))).thenReturn(List.of());
		assertThat(catchThrowableOfType(ValidacionException.class,
				() -> servicio.iniciar(usuarioId, viajeId, List.of(new ObjectId().toHexString()))).getErrores())
				.containsExactly(new ErrorCampo("boardedBookingIds", "Hay reservas que no pertenecen a este viaje"));
		verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Viaje.class));
	}

	@Test
	void finalizarCompletaElViajeYLasReservasABordo() {
		existeViaje(EstadoViaje.EN_CURSO, enMinutos(-20));

		servicio.finalizar(usuarioId, viajeId);

		assertThat(actualizacion(Viaje.class)).containsEntry("estado", "COMPLETADO")
				.containsEntry("finalizado_por", "CONDUCTOR").containsKey("fecha_fin");
		ArgumentCaptor<Update> reservas = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateMulti(any(Query.class), reservas.capture(), eq(Reserva.class));
		assertThat(reservas.getValue().getUpdateObject().get("$set", Document.class))
				.containsEntry("estado", "COMPLETADA");
		verify(libro, times(1)).liquidarViaje(any(Viaje.class), any(Instant.class));
	}

	@Test
	void finalizarNotificaAlConductorYALosPasajerosQueViajaron() {
		existeViaje(EstadoViaje.EN_CURSO, enMinutos(-20));
		Reserva completada = reserva(new ObjectId(), new ObjectId(), EstadoReserva.COMPLETADA, enMinutos(-20));
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class))).thenReturn(List.of(completada));
		when(libro.liquidarViaje(any(Viaje.class), any(Instant.class))).thenReturn(12);

		servicio.finalizar(usuarioId, viajeId);

		verify(notificador).viajeCompletadoConductor(any(Viaje.class), eq(List.of(completada)), eq(12),
				any(Instant.class));
		verify(notificador).viajeCompletadoPasajero(any(Viaje.class), eq(completada), any(Instant.class));
	}

	@Test
	void finalizarExigeUnViajeEnCurso() {
		existeViaje(EstadoViaje.PUBLICADO, enMinutos(5));
		falla(() -> servicio.finalizar(usuarioId, viajeId), CodigoError.INVALID_STATUS, "Este viaje no está en curso");
	}

	// ---------------------------------------------------------------- Contador

	@Test
	void elContadorAnticipaElBloqueoDeLaSiguienteCancelacion() {
		Instant ahora = Instant.parse("2030-01-15T12:00:00Z");
		List<Instant> nueve = java.util.stream.IntStream.range(0, 9)
				.mapToObj(dia -> ahora.minus(Duration.ofDays(20 - dia))).toList();

		Contador contador = CancelacionesConductorService.contador(nueve, ahora, 10, 30);

		assertThat(contador.cancelaciones()).isEqualTo(9);
		assertThat(contador.bloqueadoHasta()).isNull();
		// Con la décima, el bloqueo dura hasta que la más antigua salga de la ventana.
		assertThat(contador.bloqueadoHastaSiCancela()).isEqualTo(nueve.getFirst().plus(Duration.ofDays(30)));
	}
}
