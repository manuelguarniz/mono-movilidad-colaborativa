package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ListadoViajesDto.ReservaActivaDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Conductor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto.BloqueoCancelacionesDto;

import java.time.Instant;
import java.util.List;

/**
 * Viaje con la ruta completa (origen, paradas y destino con coordenadas) para dibujar el mapa. En GET /rides/{rideId}
 * trae además lo que decide la barra inferior del detalle (P09): myBooking, la reserva activa del usuario en este
 * viaje (09-B); activeBooking, su reserva activa en otro viaje (RN-23), y bookingBlock, su bloqueo por cancelaciones
 * (RN-38). Son null si no aplican y siempre null al publicar.
 */
public record ViajeDetalleDto(
		String id,
		String status,
		String direction,
		Instant departureTime,
		Integer pricePerSeat,
		Integer totalSeats,
		Integer availableSeats,
		Double distanceKm,
		Integer durationMin,
		Conductor driver,
		Vehiculo vehicle,
		List<String> conditions,
		LugarDto origin,
		LugarDto destination,
		List<LugarDto> stops,
		Instant createdAt,
		ViajeResumenDto.Sede campus,
		MiReservaDto myBooking,
		ReservaActivaDto activeBooking,
		BloqueoCancelacionesDto bookingBlock) {

	/**
	 * Reserva activa del usuario en este viaje. status es CONFIRMED o IN_RIDE; cancellableUntil es la salida menos
	 * minutos_limite_cancelacion (RN-25).
	 */
	public record MiReservaDto(String id, String status, Integer seats, Integer totalCredits,
			Instant cancellableUntil) {

		public static MiReservaDto desde(Reserva reserva, int minutosLimiteCancelacion) {
			return new MiReservaDto(reserva.id().toHexString(),
					reserva.estado() == EstadoReserva.EN_VIAJE ? "IN_RIDE" : "CONFIRMED",
					reserva.plazas(),
					reserva.totalCreditos(),
					reserva.viaje().fechaSalida().minusSeconds(60L * minutosLimiteCancelacion));
		}
	}

	public static ViajeDetalleDto desde(Viaje viaje) {
		return desde(viaje, null, null, null);
	}

	public static ViajeDetalleDto desde(Viaje viaje, MiReservaDto miReserva, ReservaActivaDto reservaActiva,
			BloqueoCancelacionesDto bloqueo) {
		return new ViajeDetalleDto(
				viaje.id().toHexString(),
				viaje.estado().getApi(),
				viaje.sentido().getApi(),
				viaje.fechaSalida(),
				viaje.precioPorPlaza(),
				viaje.plazasTotales(),
				viaje.plazasDisponibles(),
				viaje.distanciaKm(),
				viaje.duracionMin(),
				Conductor.desde(viaje.conductor()),
				Vehiculo.desde(viaje.vehiculo()),
				viaje.condiciones() == null ? List.of() : viaje.condiciones(),
				LugarDto.desde(viaje.origen()),
				LugarDto.desde(viaje.destino()),
				viaje.paradas() == null ? List.of() : viaje.paradas().stream().map(LugarDto::desde).toList(),
				viaje.fechaCreacion(),
				ViajeResumenDto.Sede.desde(viaje.sede()),
				miReserva,
				reservaActiva,
				bloqueo);
	}
}
