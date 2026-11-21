package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Tipos de movimientos_creditos (README, sección 5.1). En MongoDB va el nombre en español; la API usa el inglés. */
@Getter
@RequiredArgsConstructor
public enum TipoMovimiento {
	RECARGA("TOP_UP"),
	RETENCION_RESERVA("BOOKING_HOLD"),
	REEMBOLSO("REFUND"),
	COBRO_VIAJE("RIDE_EARNING"),
	RETIRO("WITHDRAWAL"),
	REVERSION_RETIRO("WITHDRAWAL_REVERSAL");

	private final String api;
}
