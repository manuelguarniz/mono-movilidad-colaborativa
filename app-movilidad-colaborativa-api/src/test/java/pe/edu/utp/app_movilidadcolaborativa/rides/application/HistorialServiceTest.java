package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.model.CalificacionViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto.EntradaDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Actor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.ResumenViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Tarjetas del historial (RF-09, RN-50): créditos, pasajeros y calificaciones, sin base de datos. */
class HistorialServiceTest {

	private final ObjectId conductorId = new ObjectId();
	private final ObjectId viajeId = new ObjectId();
	private final Instant ahora = Instant.now();

	private Viaje viaje(EstadoViaje estado, Instant fin) {
		return Viajes.publicado(viajeId, conductorId).estado(estado).fechaFin(fin).build();
	}

	private Reserva reserva(String nombre, EstadoReserva estado, Boolean liquidada, Actor canceladaPor) {
		return Reserva.builder().id(new ObjectId()).viajeId(viajeId)
				.pasajero(new ReferenciaNombre(new ObjectId(), nombre))
				.viaje(new ResumenViaje("Campus UTP Trujillo", "Urb. El Golf", ahora, "Carlos M.", null))
				.plazas(2).totalCreditos(12).estado(estado).liquidada(liquidada).canceladaPor(canceladaPor)
				.fechaCreacion(ahora).build();
	}

	private static CalificacionViaje dada(Reserva reserva, int puntaje) {
		return CalificacionViaje.builder().id(new ObjectId()).reservaId(reserva.id()).puntaje(puntaje)
				.comentario("No debe salir").build();
	}

	@Test
	void pasajeroCompletadoEnPlazoPuedeCalificar() {
		Reserva completada = reserva("Lucía R.", EstadoReserva.COMPLETADA, true, null);
		EntradaDto entrada = HistorialService.entradaPasajero(completada,
				viaje(EstadoViaje.COMPLETADO, ahora.minus(2, ChronoUnit.HOURS)), null, 1, ahora);

		assertThat(entrada.status()).isEqualTo("COMPLETED");
		assertThat(entrada.credits()).isEqualTo(12);
		assertThat(entrada.driver().name()).isEqualTo("Carlos M.");
		assertThat(entrada.vehicle().plate()).isEqualTo("ABC-123");
		assertThat(entrada.rating().open()).isTrue();
		assertThat(entrada.rating().pending()).isEqualTo(1);
		assertThat(entrada.rating().deadline()).isEqualTo(entrada.finishedAt().plus(1, ChronoUnit.DAYS));
	}

	@Test
	void pasajeroYaCalificadoMuestraSuPuntaje() {
		Reserva completada = reserva("Lucía R.", EstadoReserva.COMPLETADA, true, null);
		EntradaDto entrada = HistorialService.entradaPasajero(completada,
				viaje(EstadoViaje.COMPLETADO, ahora.minus(30, ChronoUnit.HOURS)), dada(completada, 5), 1, ahora);

		assertThat(entrada.rating().open()).isFalse();
		assertThat(entrada.rating().pending()).isZero();
		assertThat(entrada.rating().given()).singleElement().satisfies(d -> assertThat(d.score()).isEqualTo(5));
	}

	@Test
	void pasajeroCanceladoOAusenteNoCalifica() {
		Reserva cancelada = reserva("Lucía R.", EstadoReserva.CANCELADA, true, Actor.CONDUCTOR);
		EntradaDto entrada = HistorialService.entradaPasajero(cancelada, viaje(EstadoViaje.CANCELADO, null), null, 1,
				ahora);
		assertThat(entrada.status()).isEqualTo("CANCELLED");
		assertThat(entrada.cancelledBy()).isEqualTo("DRIVER");
		assertThat(entrada.credits()).isEqualTo(12);
		assertThat(entrada.rating()).isNull();

		Reserva ausente = reserva("Lucía R.", EstadoReserva.NO_SE_PRESENTO, true, null);
		assertThat(HistorialService.entradaPasajero(ausente,
				viaje(EstadoViaje.COMPLETADO, ahora), null, 1, ahora).rating()).isNull();

		// Anterior a la billetera: no movió créditos.
		Reserva antigua = reserva("Lucía R.", EstadoReserva.COMPLETADA, null, null);
		assertThat(HistorialService.entradaPasajero(antigua,
				viaje(EstadoViaje.COMPLETADO, ahora), null, 1, ahora).credits()).isZero();
	}

	@Test
	void pasajeroSinViajeUsaLaCopiaDeLaReserva() {
		EntradaDto entrada = HistorialService.entradaPasajero(
				reserva("Lucía R.", EstadoReserva.CANCELADA, true, Actor.PASAJERO), null, null, 1, ahora);
		assertThat(entrada.origin().label()).isEqualTo("Campus UTP Trujillo");
		assertThat(entrada.driver().name()).isEqualTo("Carlos M.");
		assertThat(entrada.cancelledBy()).isEqualTo("PASSENGER");
	}

	@Test
	void conductorCobraSubidosYAusentesYCalificaParcialmente() {
		Reserva lucia = reserva("Lucía R.", EstadoReserva.COMPLETADA, true, null);
		Reserva mateo = reserva("Mateo R.", EstadoReserva.COMPLETADA, true, null);
		Reserva jorge = reserva("Jorge P.", EstadoReserva.NO_SE_PRESENTO, true, null);
		Reserva cancelo = reserva("Ana V.", EstadoReserva.CANCELADA, true, Actor.PASAJERO);

		EntradaDto entrada = HistorialService.entradaConductor(
				viaje(EstadoViaje.COMPLETADO, ahora.minus(1, ChronoUnit.HOURS)), List.of(lucia, mateo, jorge, cancelo),
				Map.of(lucia.id(), dada(lucia, 5)), Map.of(), 1, ahora);

		assertThat(entrada.role()).isEqualTo("DRIVER");
		assertThat(entrada.credits()).isEqualTo(36);
		assertThat(entrada.passengers()).extracting("name").containsExactly("Lucía R.", "Mateo R.");
		assertThat(entrada.noShows()).isEqualTo(1);
		assertThat(entrada.refundedBookings()).isZero();
		assertThat(entrada.rating().pending()).isEqualTo(1);
		assertThat(entrada.rating().given()).extracting("name").containsExactly("Lucía R.");
		assertThat(entrada.driver()).isNull();
	}

	@Test
	void conductorCanceladoCuentaLasReservasReembolsadas() {
		EntradaDto entrada = HistorialService.entradaConductor(
				Viajes.publicado(viajeId, conductorId).estado(EstadoViaje.CANCELADO).canceladoPor(Actor.SISTEMA).build(),
				List.of(reserva("Lucía R.", EstadoReserva.CANCELADA, true, Actor.SISTEMA),
						reserva("Ana V.", EstadoReserva.CANCELADA, true, Actor.PASAJERO)),
				Map.of(), Map.of(), 1, ahora);

		assertThat(entrada.status()).isEqualTo("CANCELLED");
		assertThat(entrada.cancelledBy()).isEqualTo("SYSTEM");
		assertThat(entrada.refundedBookings()).isEqualTo(1);
		assertThat(entrada.credits()).isZero();
		assertThat(entrada.rating()).isNull();
	}
}
