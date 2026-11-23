package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import pe.edu.utp.app_movilidadcolaborativa.notifications.application.Notificador;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.TransientDataAccessResourceException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.transaction.PlatformTransactionManager;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.ResumenViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.VehiculoResumen;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ReservaRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.AsistenciaMovilidad;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoAsistencia;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;
import pe.edu.utp.app_movilidadcolaborativa.wallet.application.LibroCreditos;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.OptionalInt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Camino feliz y reglas de estado de la reserva (RF-04, RN-23, RN-38, RN-39), sin base de datos. */
class ReservaServiceTest {

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final ViajeRepository viajeRepository = mock(ViajeRepository.class);
	private final ReservaRepository reservaRepository = mock(ReservaRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final PlatformTransactionManager transacciones = mock(PlatformTransactionManager.class);
	private final RestriccionesPasajeroService restricciones = mock(RestriccionesPasajeroService.class);
	private final LibroCreditos libro = mock(LibroCreditos.class);
	private final Notificador notificador = mock(Notificador.class);
	private final ReservaService servicio = new ReservaService(usuarioRepository, viajeRepository, reservaRepository,
			mongoTemplate, transacciones, restricciones, libro, notificador);
	private final ObjectId pasajeroId = new ObjectId();
	private final ObjectId conductorId = new ObjectId();
	private final ObjectId viajeId = new ObjectId();

	{
		when(libro.retener(any(Reserva.class), any(Instant.class))).thenReturn(OptionalInt.of(90));
	}

	private void existePasajero(EstadoUsuario estado) {
		existePasajero(estado, 100);
	}

	private void existePasajero(EstadoUsuario estado, Integer saldo) {
		when(usuarioRepository.findById(pasajeroId)).thenReturn(Optional.of(Usuario.builder().id(pasajeroId)
				.nombres("Valeria").apellidos("Rodríguez").estado(estado).saldoCreditos(saldo).build()));
	}

	private void existe(Viaje viaje) {
		when(viajeRepository.findById(viajeId)).thenReturn(Optional.of(viaje));
	}

	private Viaje.ViajeBuilder viaje() {
		return Viajes.publicado(viajeId, conductorId);
	}

	private void elDescuentoModifica(long documentos) {
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Viaje.class)))
				.thenReturn(UpdateResult.acknowledged(documentos, documentos, null));
	}

	private void falla(int plazas, CodigoError codigo) {
		assertThatThrownBy(() -> servicio.reservar(pasajeroId, viajeId, plazas))
				.isInstanceOfSatisfying(ApiException.class, ex -> assertThat(ex.getCodigo()).isEqualTo(codigo));
	}

	// ------------------------------------------------------------ Camino feliz

	@Test
	void reservarDescuentaLasPlazasYCreaLaReservaEnUnaTransaccion() {
		existePasajero(EstadoUsuario.ACTIVO);
		Viaje viaje = viaje().build();
		existe(viaje);
		elDescuentoModifica(1);

		servicio.reservar(pasajeroId, viajeId, 2);

		ArgumentCaptor<Query> filtro = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> descuento = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(filtro.capture(), descuento.capture(), eq(Viaje.class));
		assertThat(filtro.getValue().getQueryObject()).containsEntry("_id", viajeId)
				.containsEntry("estado", EstadoViaje.PUBLICADO)
				.containsEntry("plazas_disponibles", new Document("$gte", 2));
		assertThat(descuento.getValue().getUpdateObject().get("$inc", Document.class))
				.containsEntry("plazas_disponibles", -2);

		ArgumentCaptor<Reserva> guardada = ArgumentCaptor.forClass(Reserva.class);
		verify(mongoTemplate).insert(guardada.capture());
		Reserva reserva = guardada.getValue();
		assertThat(reserva.id()).isNotNull();
		assertThat(reserva.viajeId()).isEqualTo(viajeId);
		assertThat(reserva.pasajero()).isEqualTo(new ReferenciaNombre(pasajeroId, "Valeria R."));
		assertThat(reserva.viaje()).isEqualTo(new ResumenViaje("UTP Sede Trujillo", "Huaca del Dragón",
				viaje.fechaSalida(), "Carlos M.", new VehiculoResumen("Toyota", "Yaris", "Blanco")));
		assertThat(reserva.plazas()).isEqualTo(2);
		assertThat(reserva.totalCreditos()).isEqualTo(10);
		assertThat(reserva.estado()).isEqualTo(EstadoReserva.CONFIRMADA);
		assertThat(reserva.liquidada()).isFalse();
		assertThat(reserva.asistencia()).isNull();
		assertThat(reserva.fechaCancelacion()).isNull();
		verify(libro).retener(reserva, reserva.fechaCreacion());
		assertThat(reserva.fechaCreacion()).isEqualTo(reserva.fechaActualizacion()).isNotNull();
		// RN-32: la notificación al conductor va en la misma transacción.
		verify(notificador).nuevaReserva(viaje, reserva, reserva.fechaCreacion());

		verify(transacciones).commit(any());
		verify(transacciones, never()).rollback(any());
	}

	@Test
	void laReservaCopiaLaAsistenciaDelPasajeroSinElConsentimiento() {
		when(usuarioRepository.findById(pasajeroId)).thenReturn(Optional.of(Usuario.builder().id(pasajeroId)
				.nombres("Valeria").apellidos("Rodríguez").estado(EstadoUsuario.ACTIVO).saldoCreditos(100)
				.asistenciaMovilidad(new AsistenciaMovilidad(TipoAsistencia.SILLA_RUEDAS, "Silla plegable",
						Instant.parse("2026-10-01T15:04:00Z")))
				.build()));
		existe(viaje().build());
		elDescuentoModifica(1);

		servicio.reservar(pasajeroId, viajeId, 1);

		ArgumentCaptor<Reserva> guardada = ArgumentCaptor.forClass(Reserva.class);
		verify(mongoTemplate).insert(guardada.capture());
		assertThat(guardada.getValue().asistencia())
				.isEqualTo(new Reserva.Asistencia(TipoAsistencia.SILLA_RUEDAS, "Silla plegable"));
		assertThat(guardada.getValue().toString()).doesNotContain("Silla plegable");
	}

	@Test
	void unChoqueEntreReservasSimultaneasSeReintenta() {
		existePasajero(EstadoUsuario.ACTIVO);
		existe(viaje().build());
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Viaje.class)))
				.thenThrow(new TransientDataAccessResourceException("WriteConflict"))
				.thenReturn(UpdateResult.acknowledged(1, 1L, null));

		servicio.reservar(pasajeroId, viajeId, 1);

		verify(transacciones).rollback(any());
		verify(transacciones).commit(any());
		verify(mongoTemplate, times(1)).insert(any(Reserva.class));
	}

	// ------------------------------------------------------------------- Saldo

	@Test
	void sinSaldoSuficienteNoSeReservaYSeInformaCuantoFalta() {
		// Cuenta anterior a la billetera: sin saldo_creditos vale 0.
		existePasajero(EstadoUsuario.ACTIVO, null);
		existe(viaje().build());
		ApiException error = org.assertj.core.api.Assertions.catchThrowableOfType(ApiException.class,
				() -> servicio.reservar(pasajeroId, viajeId, 2));
		assertThat(error.getCodigo()).isEqualTo(CodigoError.INSUFFICIENT_CREDITS);
		assertThat(error.getMessage()).isEqualTo("Saldo insuficiente: necesitas 10 créditos y tienes 0.");
		assertThat(error.getDetalles()).isEqualTo(Map.of("required", 10, "available", 0));
		verifyNoInteractions(mongoTemplate, transacciones);
	}

	@Test
	void siElSaldoBajaAntesDeRetenerSeRevierteLaReserva() {
		existePasajero(EstadoUsuario.ACTIVO, 10);
		existe(viaje().build());
		elDescuentoModifica(1);
		when(libro.retener(any(Reserva.class), any(Instant.class))).thenReturn(OptionalInt.empty());

		falla(2, CodigoError.INSUFFICIENT_CREDITS);
		verify(transacciones).rollback(any());
		verify(transacciones, never()).commit(any());
	}

	// ------------------------------------------------------- Reglas de estado

	@Test
	void elViajeDebeExistirSerAjenoYSeguirDisponible() {
		existePasajero(EstadoUsuario.ACTIVO);
		when(viajeRepository.findById(viajeId)).thenReturn(Optional.empty());
		falla(1, CodigoError.RIDE_NOT_FOUND);

		existe(Viajes.publicado(viajeId, pasajeroId).build());
		falla(1, CodigoError.OWN_RIDE);

		existe(viaje().estado(EstadoViaje.CANCELADO).build());
		falla(1, CodigoError.RIDE_NOT_AVAILABLE);
		existe(viaje().fechaSalida(Instant.now().minusSeconds(60)).build());
		falla(1, CodigoError.RIDE_NOT_AVAILABLE);
		verifyNoInteractions(mongoTemplate, transacciones);
	}

	@Test
	void sinPlazasSuficientesSeRechazaSinGuardarLaReserva() {
		existePasajero(EstadoUsuario.ACTIVO);
		existe(viaje().plazasDisponibles(1).build());
		falla(2, CodigoError.NO_SEATS_AVAILABLE);
		verifyNoInteractions(mongoTemplate);

		// Otro pasajero tomó la última plaza entre la lectura y el descuento.
		elDescuentoModifica(0);
		falla(1, CodigoError.NO_SEATS_AVAILABLE);
		verify(mongoTemplate, never()).insert(any(Reserva.class));
		verify(transacciones).rollback(any());
		verify(transacciones, never()).commit(any());
	}

	@Test
	void unPasajeroSoloTieneUnaReservaConfirmadaPorViaje() {
		existePasajero(EstadoUsuario.ACTIVO);
		existe(viaje().build());
		when(reservaRepository.existsByViajeIdAndPasajeroIdAndEstado(viajeId, pasajeroId, EstadoReserva.CONFIRMADA))
				.thenReturn(true);
		falla(1, CodigoError.ALREADY_BOOKED);
		verifyNoInteractions(mongoTemplate);

		// Dos reservas simultáneas del mismo pasajero: responde el índice único y la plaza no se descuenta.
		when(reservaRepository.existsByViajeIdAndPasajeroIdAndEstado(viajeId, pasajeroId, EstadoReserva.CONFIRMADA))
				.thenReturn(false);
		elDescuentoModifica(1);
		when(mongoTemplate.insert(any(Reserva.class))).thenThrow(new DuplicateKeyException("reservas"));
		falla(1, CodigoError.ALREADY_BOOKED);
		verify(transacciones).rollback(any());
		verify(transacciones, never()).commit(any());
	}

	@Test
	void unPasajeroConUnaReservaActivaOBloqueadoNoPuedeReservar() {
		existePasajero(EstadoUsuario.ACTIVO);
		existe(viaje().build());
		when(restricciones.reservaActiva(pasajeroId)).thenReturn(Optional.of(Reserva.builder().build()));
		falla(1, CodigoError.ACTIVE_BOOKING_EXISTS);

		when(restricciones.reservaActiva(pasajeroId)).thenReturn(Optional.empty());
		when(restricciones.bloqueo(eq(pasajeroId), any(Instant.class))).thenReturn(Optional.of(
				new CancelacionesConductorService.Bloqueo(5, 30, Instant.parse("2026-11-08T15:00:00Z"))));
		ApiException error = org.assertj.core.api.Assertions.catchThrowableOfType(ApiException.class,
				() -> servicio.reservar(pasajeroId, viajeId, 1));
		assertThat(error.getCodigo()).isEqualTo(CodigoError.PASSENGER_CANCELLATION_LIMIT);
		assertThat(error.getMessage()).isEqualTo(
				"Cancelaste o no te presentaste a 5 viajes en los últimos 30 días. Podrás reservar de nuevo desde el 08/11.");
		verifyNoInteractions(mongoTemplate);
	}

	@Test
	void elPasajeroDebeTenerElPerfilCompletoYLaCuentaActiva() {
		existePasajero(EstadoUsuario.PERFIL_PENDIENTE);
		falla(1, CodigoError.PROFILE_INCOMPLETE);
		existePasajero(EstadoUsuario.BLOQUEADO);
		falla(1, CodigoError.UNAUTHORIZED);
		verifyNoInteractions(viajeRepository, mongoTemplate);
	}
}
