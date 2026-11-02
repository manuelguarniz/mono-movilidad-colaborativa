package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;

import java.time.Instant;
import java.util.List;

/**
 * Mis viajes del pasajero (RF-06): su reserva activa, las que le cancelaron el conductor o el sistema en las últimas
 * 24 h, y sus cancelaciones en la ventana (RN-38).
 */
public record MisReservasDto(ReservaPropiaDto active, List<ReservaPropiaDto> cancelled,
		ContadorCancelacionesDto cancellations) {

	/**
	 * status es CONFIRMED, IN_RIDE o CANCELLED; cancelledBy es DRIVER o SYSTEM en las canceladas. cancellableUntil es
	 * la salida menos minutos_limite_cancelacion (RN-25).
	 */
	public record ReservaPropiaDto(String id, String status, String cancelledBy, Integer seats, Integer totalCredits,
			Instant cancellableUntil, ViajeResumenDto ride) {

		public static ReservaPropiaDto desde(Reserva reserva, Viaje viaje, int minutosLimiteCancelacion) {
			return new ReservaPropiaDto(reserva.id().toHexString(), estado(reserva.estado()),
					reserva.canceladaPor() == null ? null : reserva.canceladaPor().getApi(),
					reserva.plazas(), reserva.totalCreditos(),
					viaje.fechaSalida().minusSeconds(60L * minutosLimiteCancelacion),
					ViajeResumenDto.desde(viaje));
		}

		private static String estado(EstadoReserva estado) {
			return switch (estado) {
				case EN_VIAJE -> "IN_RIDE";
				case CANCELADA -> "CANCELLED";
				default -> "CONFIRMED";
			};
		}
	}
}
