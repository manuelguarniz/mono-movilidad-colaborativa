package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Conductor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.LugarResumen;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Sede;

import java.time.Instant;
import java.util.List;

/** Página del historial (RF-09): viajes terminados, del más reciente al más antiguo, 20 por página (RN-50). */
public record HistorialDto(List<EntradaDto> data, int page, boolean hasMore) {

	/**
	 * Un viaje terminado. Como pasajero (role PASSENGER), id es la reserva y status sale de ella (COMPLETED, CANCELLED
	 * o NO_SHOW); como conductor (DRIVER), id es el viaje y status es COMPLETED o CANCELLED. cancelledBy es PASSENGER,
	 * DRIVER o SYSTEM.
	 * <p>
	 * credits: como pasajero, lo que pagó (COMPLETED), le devolvieron (CANCELLED) o se pagó al conductor (NO_SHOW), 0
	 * en las reservas anteriores a la billetera; como conductor, lo cobrado de los que subieron y de los ausentes.
	 * Solo como pasajero: seats y driver. Solo como conductor: passengers (los que subieron), noShows y
	 * refundedBookings (reservas que se reembolsaron al cancelarse el viaje). Nunca lleva la asistencia de movilidad
	 * (RN-22). rating solo aparece cuando hay a quién calificar o ya venció el plazo (viajes completados).
	 */
	public record EntradaDto(String id, String rideId, String role, String status, String cancelledBy,
			Instant departureTime, Instant finishedAt, Sede campus, LugarResumen origin, LugarResumen destination,
			Integer seats, int credits, Conductor driver, VehiculoDto vehicle, List<PasajeroDto> passengers,
			Integer noShows, Integer refundedBookings, CalificacionesDto rating) {
	}

	public record VehiculoDto(String brand, String model, String color, String plate) {
	}

	public record PasajeroDto(String bookingId, String id, String name, String photoUrl, Integer seats) {
	}

	/**
	 * Calificación de un viaje completado (RN-47): deadline = fecha_fin + dias_para_calificar; open es false si ya
	 * venció. pending es cuántas personas faltan calificar y given, las que el usuario ya calificó con su puntaje. El
	 * comentario no se incluye.
	 */
	public record CalificacionesDto(Instant deadline, boolean open, int pending, List<DadaDto> given) {
	}

	public record DadaDto(String userId, String name, int score) {
	}
}
