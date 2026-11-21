package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.MovimientoCredito;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.Retiro;

import java.time.Instant;

/**
 * Un movimiento de la billetera. amount lleva el signo. withdrawal solo existe en WITHDRAWAL y WITHDRAWAL_REVERSAL:
 * el estado actual del retiro (PENDING, PAID o REJECTED) y el motivo si fue rechazado.
 */
public record MovimientoDto(
		String id,
		String type,
		int amount,
		int balanceAfter,
		String description,
		Instant createdAt,
		EstadoRetiroDto withdrawal) {

	public record EstadoRetiroDto(String id, String status, String rejectionReason) {

		public static EstadoRetiroDto desde(Retiro retiro) {
			return retiro == null ? null : new EstadoRetiroDto(retiro.id().toHexString(), retiro.estado().getApi(),
					retiro.motivoRechazo());
		}
	}

	public static MovimientoDto desde(MovimientoCredito movimiento, Retiro retiro) {
		return new MovimientoDto(movimiento.id().toHexString(), movimiento.tipo().getApi(), movimiento.monto(),
				movimiento.saldoPosterior() == null ? 0 : movimiento.saldoPosterior(), movimiento.descripcion(),
				movimiento.fechaCreacion(), EstadoRetiroDto.desde(retiro));
	}
}
