package pe.edu.utp.app_movilidadcolaborativa.rides.application;

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
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.util.Optional;

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

/** Camino feliz y reglas de estado de la reserva (RF-13, RF-14), sin base de datos. */
class ReservaServiceTest {

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final ViajeRepository viajeRepository = mock(ViajeRepository.class);
	private final ReservaRepository reservaRepository = mock(ReservaRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final PlatformTransactionManager transacciones = mock(PlatformTransactionManager.class);
	private final ReservaService servicio = new ReservaService(usuarioRepository, viajeRepository, reservaRepository,
			mongoTemplate, transacciones);
	private final ObjectId pasajeroId = new ObjectId();
	private final ObjectId conductorId = new ObjectId();
	private final ObjectId viajeId = new ObjectId();

	private void existePasajero(EstadoUsuario estado) {
		when(usuarioRepository.findById(pasajeroId)).thenReturn(Optional.of(Usuario.builder().id(pasajeroId)
				.nombres("Valeria").apellidos("Rodríguez").estado(estado).build()));
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
		assertThat(reserva.fechaCancelacion()).isNull();
		assertThat(reserva.fechaCreacion()).isEqualTo(reserva.fechaActualizacion()).isNotNull();

		verify(transacciones).commit(any());
		verify(transacciones, never()).rollback(any());
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
	void elPasajeroDebeTenerElPerfilCompletoYLaCuentaActiva() {
		existePasajero(EstadoUsuario.PERFIL_PENDIENTE);
		falla(1, CodigoError.PROFILE_INCOMPLETE);
		existePasajero(EstadoUsuario.BLOQUEADO);
		falla(1, CodigoError.UNAUTHORIZED);
		verifyNoInteractions(viajeRepository, mongoTemplate);
	}
}
