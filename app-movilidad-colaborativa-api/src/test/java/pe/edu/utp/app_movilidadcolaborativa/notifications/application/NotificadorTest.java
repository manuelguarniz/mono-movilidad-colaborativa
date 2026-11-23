package pe.edu.utp.app_movilidadcolaborativa.notifications.application;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.Notificacion;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.TipoNotificacion;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.Viajes;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoAsistencia;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.EstadoRetiro;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.Retiro;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/** Textos literales de la tabla de RF-13, destinatario y referencias de cada notificación. */
class NotificadorTest {

	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final Notificador notificador = new Notificador(mongoTemplate);
	private final ObjectId conductorId = new ObjectId();
	private final ObjectId pasajeroId = new ObjectId();
	private final Instant ahora = Instant.parse("2026-10-29T15:00:00Z");
	// 29/10 14:20 en Lima.
	private final Viaje viaje = Viajes.publicado(new ObjectId(), conductorId)
			.fechaSalida(Instant.parse("2026-10-29T19:20:00Z")).build();

	private Reserva reserva(int plazas, int total, Reserva.Asistencia asistencia) {
		return reserva(pasajeroId, "Lucía R.", plazas, total, asistencia);
	}

	private Reserva reserva(ObjectId id, String nombre, int plazas, int total, Reserva.Asistencia asistencia) {
		return Reserva.builder().id(new ObjectId()).viajeId(viaje.id())
				.pasajero(new ReferenciaNombre(id, nombre)).plazas(plazas).totalCreditos(total)
				.asistencia(asistencia).estado(EstadoReserva.CONFIRMADA).build();
	}

	private Notificacion guardada() {
		ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
		verify(mongoTemplate).insert(captor.capture());
		Notificacion notificacion = captor.getValue();
		assertThat(notificacion.leida()).isFalse();
		assertThat(notificacion.fechaCreacion()).isEqualTo(ahora);
		assertThat(notificacion.titulo()).isEqualTo(notificacion.tipo().getTitulo());
		return notificacion;
	}

	@Test
	void nuevaReservaAvisaAlConductorConLaAsistenciaAparte() {
		Reserva reserva = reserva(2, 10, new Reserva.Asistencia(TipoAsistencia.SILLA_RUEDAS, "nota privada"));
		notificador.nuevaReserva(viaje, reserva, ahora);

		Notificacion notificacion = guardada();
		assertThat(notificacion.usuarioId()).isEqualTo(conductorId);
		assertThat(notificacion.tipo()).isEqualTo(TipoNotificacion.NUEVA_RESERVA);
		assertThat(notificacion.titulo()).isEqualTo("Nueva reserva");
		assertThat(notificacion.mensaje()).isEqualTo("Lucía R. reservó 2 plaza(s) en tu viaje del 29/10 14:20.");
		// RN-22 y RNF-13: solo el tipo, nunca la nota.
		assertThat(notificacion.asistencia()).isEqualTo("Necesita asistencia: Silla de ruedas.");
		assertThat(notificacion.viajeId()).isEqualTo(viaje.id());
		assertThat(notificacion.reservaId()).isEqualTo(reserva.id());
	}

	@Test
	void reservaCanceladaDiceLasPlazasLibres() {
		notificador.reservaCancelada(Viajes.publicado(viaje.id(), conductorId).fechaSalida(viaje.fechaSalida())
				.plazasDisponibles(3).build(), reserva(1, 5, null), ahora);
		Notificacion notificacion = guardada();
		assertThat(notificacion.usuarioId()).isEqualTo(conductorId);
		assertThat(notificacion.mensaje())
				.isEqualTo("Lucía R. canceló su reserva en tu viaje del 29/10 14:20. Quedan 3 plazas libres.");
		assertThat(notificacion.asistencia()).isNull();
	}

	@Test
	void viajeCanceladoLlevaElReembolsoYElMotivo() {
		notificador.viajeCancelado(viaje, reserva(2, 10, null), 10, "Emergencia mecánica", false, ahora);
		Notificacion notificacion = guardada();
		assertThat(notificacion.usuarioId()).isEqualTo(pasajeroId);
		assertThat(notificacion.mensaje()).isEqualTo("Carlos M. canceló el viaje del 29/10 14:20 a Huaca del Dragón. "
				+ "Te devolvimos 10 créditos. Motivo: Emergencia mecánica");
	}

	@Test
	void viajeCanceladoPorElSistema() {
		notificador.viajeCancelado(viaje, reserva(1, 1, null), 1, null, true, ahora);
		assertThat(guardada().mensaje()).isEqualTo("Carlos M. canceló el viaje del 29/10 14:20 a Huaca del Dragón. "
				+ "Te devolvimos 1 crédito. El conductor no inició el viaje.");
	}

	@Test
	void inicioYAusencia() {
		notificador.viajeIniciado(viaje, reserva(1, 5, null), ahora);
		Notificacion iniciado = guardada();
		assertThat(iniciado.tipo()).isEqualTo(TipoNotificacion.VIAJE_INICIADO);
		assertThat(iniciado.mensaje()).isEqualTo("Tu viaje a Huaca del Dragón inició.");

		MongoTemplate otro = mock(MongoTemplate.class);
		new Notificador(otro).noSePresento(viaje, reserva(2, 12, null), ahora);
		ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
		verify(otro).insert(captor.capture());
		assertThat(captor.getValue().titulo()).isEqualTo("No te presentaste");
		assertThat(captor.getValue().mensaje())
				.isEqualTo("El conductor marcó que no subiste al viaje del 29/10 14:20. Se cobraron 12 créditos.");
	}

	@Test
	void viajeCompletadoAlConductorNombraAQuienesCalificarYLoCobrado() {
		Reserva lucia = reserva(1, 9, null);
		Reserva mateo = reserva(new ObjectId(), "Mateo R.", 1, 9, null);
		Reserva sofia = reserva(new ObjectId(), "Sofía A.", 1, 9, null);
		notificador.viajeCompletadoConductor(viaje, List.of(lucia, mateo, sofia), 18, ahora);
		Notificacion notificacion = guardada();
		assertThat(notificacion.usuarioId()).isEqualTo(conductorId);
		assertThat(notificacion.mensaje()).isEqualTo(
				"Tu viaje a Huaca del Dragón terminó. ¡Califica a Lucía R., Mateo R. y Sofía A.! Recibiste 18 créditos.");
		assertThat(notificacion.reservaId()).isNull();
	}

	@Test
	void viajeCompletadoAlPasajeroNombraAlConductor() {
		notificador.viajeCompletadoPasajero(viaje, reserva(1, 9, null), ahora);
		Notificacion notificacion = guardada();
		assertThat(notificacion.usuarioId()).isEqualTo(pasajeroId);
		assertThat(notificacion.mensaje()).isEqualTo("Tu viaje a Huaca del Dragón terminó. ¡Califica a Carlos M.!");
	}

	@Test
	void retiroRechazado() {
		notificador.retiroRechazado(Retiro.builder().id(new ObjectId()).usuarioId(conductorId).creditos(50)
				.estado(EstadoRetiro.RECHAZADO).motivoRechazo("Número sin Yape.").build(), ahora);
		Notificacion notificacion = guardada();
		assertThat(notificacion.usuarioId()).isEqualTo(conductorId);
		assertThat(notificacion.mensaje())
				.isEqualTo("Tu retiro de 50 créditos fue rechazado: Número sin Yape. Te devolvimos los créditos.");
		assertThat(notificacion.viajeId()).isNull();
	}
}
