package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto;

import java.time.Instant;

/**
 * Resumen de la billetera (RF-11, P21). withdrawable es el saldo retirable de RN-42. heldBooking es la reserva activa
 * que explica lo retenido (21-B); pendingWithdrawal, el retiro en proceso (21-F); lastYapePhone, el celular del último
 * retiro para precargar el formulario. Los tres son null si no hay.
 */
public record BilleteraDto(
		int available,
		int held,
		int withdrawable,
		String activeMode,
		boolean driver,
		ReservaRetenidaDto heldBooking,
		RetiroPendienteDto pendingWithdrawal,
		String lastYapePhone,
		LimitesDto limits) {

	public record ReservaRetenidaDto(String id, String rideId, Instant departureTime, String origin,
			String destination, int credits) {
	}

	public record RetiroPendienteDto(String id, int credits, String phoneLast3, Instant requestedAt) {
	}

	/** Parámetros de RN-41 y RN-42, para validar en el formulario lo mismo que el backend. */
	public record LimitesDto(int topUpMin, int topUpMax, int withdrawalMin) {
	}
}
