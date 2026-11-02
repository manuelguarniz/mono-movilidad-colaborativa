package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto.BloqueoCancelacionesDto;

import java.time.Instant;
import java.util.List;

/**
 * Página del listado del dashboard (RF-03), 20 viajes por página. activeBooking y bookingBlock explican por qué
 * el pasajero no puede reservar (RN-23 y RN-38); son null si puede.
 */
public record ListadoViajesDto(
		List<ViajeResumenDto> data,
		int page,
		boolean hasMore,
		ReservaActivaDto activeBooking,
		BloqueoCancelacionesDto bookingBlock) {

	/** Reserva activa del pasajero, con lo necesario para la franja de 06-B. */
	public record ReservaActivaDto(String id, String rideId, Instant departureTime, String origin,
			String destination) {

		public static ReservaActivaDto desde(Reserva reserva) {
			return new ReservaActivaDto(reserva.id().toHexString(), reserva.viajeId().toHexString(),
					reserva.viaje().fechaSalida(), reserva.viaje().origen(), reserva.viaje().destino());
		}
	}
}
