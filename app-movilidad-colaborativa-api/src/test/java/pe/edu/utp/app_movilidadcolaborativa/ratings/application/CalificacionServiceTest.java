package pe.edu.utp.app_movilidadcolaborativa.ratings.application;

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
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.CalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.CalificarRequest;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.ContextoCalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.model.CalificacionViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.Viajes;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.ResumenViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ReservaRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Calificaciones (RF-10, RN-47), sin base de datos. */
class CalificacionServiceTest {

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final ViajeRepository viajeRepository = mock(ViajeRepository.class);
	private final ReservaRepository reservaRepository = mock(ReservaRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final PlatformTransactionManager transacciones = mock(PlatformTransactionManager.class);
	private final ParametrosService parametros = mock(ParametrosService.class);
	private final CalificacionService servicio = new CalificacionService(usuarioRepository, viajeRepository,
			reservaRepository, mongoTemplate, transacciones, parametros);

	private final ObjectId conductorId = new ObjectId();
	private final ObjectId pasajeroId = new ObjectId();
	private final ObjectId viajeId = new ObjectId();
	private final ObjectId reservaId = new ObjectId();

	{
		when(parametros.leer()).thenReturn(ParametrosService.Parametros.POR_DEFECTO);
		for (ObjectId id : List.of(conductorId, pasajeroId)) {
			when(usuarioRepository.findById(id)).thenReturn(Optional.of(Usuario.builder().id(id)
					.nombres(id == conductorId ? "Carlos" : "Lucía").apellidos(id == conductorId ? "Mendoza" : "Ruiz")
					.estado(EstadoUsuario.ACTIVO).build()));
		}
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), any(Class.class)))
				.thenReturn(UpdateResult.acknowledged(1, 1L, null));
		when(mongoTemplate.aggregate(any(Aggregation.class), eq("calificaciones"), eq(Document.class)))
				.thenReturn(new AggregationResults<>(List.of(new Document("promedio", 4.66).append("cantidad", 3)),
						new Document()));
	}

	private void existe(EstadoViaje estadoViaje, Instant fin, EstadoReserva estadoReserva) {
		when(viajeRepository.findById(viajeId)).thenReturn(Optional.of(
				Viajes.publicado(viajeId, conductorId).estado(estadoViaje).fechaFin(fin).build()));
		Reserva reserva = Reserva.builder().id(reservaId).viajeId(viajeId)
				.pasajero(new ReferenciaNombre(pasajeroId, "Lucía R."))
				.viaje(new ResumenViaje("Campus UTP Trujillo", "Urb. El Golf", Instant.now(), "Carlos M.", null))
				.plazas(2).totalCreditos(12).estado(estadoReserva).liquidada(true).fechaCreacion(Instant.now()).build();
		when(reservaRepository.findById(reservaId)).thenReturn(Optional.of(reserva));
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class)))
				.thenReturn(estadoReserva == EstadoReserva.COMPLETADA ? List.of(reserva) : List.of());
	}

	private static Instant haceHoras(long horas) {
		return Instant.now().minus(horas, ChronoUnit.HOURS);
	}

	private CalificarRequest solicitud(int puntaje, String comentario) {
		return new CalificarRequest(reservaId.toHexString(), puntaje, comentario);
	}

	private static void falla(Runnable accion, CodigoError codigo, String mensaje) {
		assertThatThrownBy(accion::run).isInstanceOfSatisfying(ApiException.class, ex -> {
			assertThat(ex.getCodigo()).isEqualTo(codigo);
			assertThat(ex.getMessage()).isEqualTo(mensaje);
		});
	}

	@Test
	void elPasajeroCalificaAlConductorYSeRecalculaSuPromedio() {
		existe(EstadoViaje.COMPLETADO, haceHoras(2), EstadoReserva.COMPLETADA);

		CalificacionDto dto = servicio.calificar(pasajeroId, solicitud(4, "  Puntual y manejó con cuidado.  "));

		ArgumentCaptor<CalificacionViaje> insertada = ArgumentCaptor.forClass(CalificacionViaje.class);
		verify(mongoTemplate).insert(insertada.capture());
		assertThat(insertada.getValue().usuarioCalificadoId()).isEqualTo(conductorId);
		assertThat(insertada.getValue().rolCalificado()).isEqualTo(Rol.CONDUCTOR);
		assertThat(insertada.getValue().autor().nombre()).isEqualTo("Lucía R.");
		assertThat(insertada.getValue().comentario()).isEqualTo("Puntual y manejó con cuidado.");
		assertThat(dto.ratedRole()).isEqualTo("DRIVER");
		assertThat(dto.score()).isEqualTo(4);

		ArgumentCaptor<Update> perfil = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(any(Query.class), perfil.capture(), eq(Usuario.class));
		assertThat(perfil.getValue().getUpdateObject().get("$set", Document.class).get("calificacion"))
				.isEqualTo(new Calificacion(4.7, 3));
		// La copia en los viajes activos del conductor.
		verify(mongoTemplate).updateMulti(any(Query.class), any(Update.class), eq(Viaje.class));
	}

	@Test
	void elConductorCalificaAlPasajeroDeLaReserva() {
		existe(EstadoViaje.COMPLETADO, haceHoras(2), EstadoReserva.COMPLETADA);

		CalificacionDto dto = servicio.calificar(conductorId, solicitud(5, " "));

		ArgumentCaptor<CalificacionViaje> insertada = ArgumentCaptor.forClass(CalificacionViaje.class);
		verify(mongoTemplate).insert(insertada.capture());
		assertThat(insertada.getValue().usuarioCalificadoId()).isEqualTo(pasajeroId);
		assertThat(insertada.getValue().rolCalificado()).isEqualTo(Rol.PASAJERO);
		assertThat(insertada.getValue().comentario()).isNull();
		assertThat(dto.ratedUserId()).isEqualTo(pasajeroId.toHexString());
	}

	@Test
	void soloCalificanLosParticipantesDeUnViajeCompletado() {
		existe(EstadoViaje.COMPLETADO, haceHoras(2), EstadoReserva.NO_SE_PRESENTO);
		falla(() -> servicio.calificar(conductorId, solicitud(3, null)), CodigoError.RATING_NOT_ALLOWED,
				CalificacionService.NO_PARTICIPANTE);

		existe(EstadoViaje.COMPLETADO, haceHoras(2), EstadoReserva.COMPLETADA);
		ObjectId ajeno = new ObjectId();
		when(usuarioRepository.findById(ajeno)).thenReturn(Optional.of(Usuario.builder().id(ajeno)
				.nombres("Jorge").apellidos("Pérez").estado(EstadoUsuario.ACTIVO).build()));
		falla(() -> servicio.calificar(ajeno, solicitud(3, null)), CodigoError.RATING_NOT_ALLOWED,
				CalificacionService.NO_PARTICIPANTE);
		verify(mongoTemplate, never()).insert(any(CalificacionViaje.class));
	}

	@Test
	void elPlazoEsDe24HorasDesdeElFinDelViaje() {
		existe(EstadoViaje.COMPLETADO, haceHoras(25), EstadoReserva.COMPLETADA);
		falla(() -> servicio.calificar(pasajeroId, solicitud(4, null)), CodigoError.RATING_WINDOW_CLOSED,
				"El plazo para calificar este viaje terminó");
	}

	@Test
	void noSeCalificaDosVeces() {
		existe(EstadoViaje.COMPLETADO, haceHoras(2), EstadoReserva.COMPLETADA);
		when(mongoTemplate.exists(any(Query.class), eq(CalificacionViaje.class))).thenReturn(true);
		falla(() -> servicio.calificar(pasajeroId, solicitud(4, null)), CodigoError.ALREADY_RATED,
				"Ya calificaste a esta persona en este viaje");

		// Dos envíos simultáneos: el índice único rechaza el segundo.
		when(mongoTemplate.exists(any(Query.class), eq(CalificacionViaje.class))).thenReturn(false);
		when(mongoTemplate.insert(any(CalificacionViaje.class))).thenThrow(new DuplicateKeyException("dup"));
		falla(() -> servicio.calificar(pasajeroId, solicitud(4, null)), CodigoError.ALREADY_RATED,
				"Ya calificaste a esta persona en este viaje");
	}

	@Test
	void elContextoDelPasajeroTraeAlConductorSinSuCalificacion() {
		existe(EstadoViaje.COMPLETADO, haceHoras(2), EstadoReserva.COMPLETADA);

		ContextoCalificacionDto contexto = servicio.contexto(pasajeroId, viajeId);

		assertThat(contexto.role()).isEqualTo("PASSENGER");
		assertThat(contexto.open()).isTrue();
		assertThat(contexto.targets()).singleElement().satisfies(persona -> {
			assertThat(persona.role()).isEqualTo("DRIVER");
			assertThat(persona.bookingId()).isEqualTo(reservaId.toHexString());
			assertThat(persona.vehicle().plate()).isEqualTo("ABC-123");
			assertThat(persona.rated()).isFalse();
		});
	}

	@Test
	void elContextoVencidoSeDevuelveCerrado() {
		existe(EstadoViaje.COMPLETADO, haceHoras(30), EstadoReserva.COMPLETADA);
		ContextoCalificacionDto contexto = servicio.contexto(conductorId, viajeId);
		assertThat(contexto.open()).isFalse();
		assertThat(contexto.role()).isEqualTo("DRIVER");
		assertThat(contexto.targets()).singleElement()
				.satisfies(persona -> assertThat(persona.role()).isEqualTo("PASSENGER"));
	}

	@Test
	void unViajeSinTerminarNoSeCalifica() {
		existe(EstadoViaje.EN_CURSO, null, EstadoReserva.EN_VIAJE);
		falla(() -> servicio.contexto(conductorId, viajeId), CodigoError.RATING_NOT_ALLOWED,
				CalificacionService.NO_PARTICIPANTE);
	}
}
