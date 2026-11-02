package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.application.CancelacionesConductorService.Contador;

import java.time.Instant;

/**
 * Cancelaciones dentro de la ventana (RN-30 del conductor, RN-38 del pasajero). blockedUntil es el bloqueo actual;
 * blockedUntilIfCancelled, el que tendría con una cancelación más ahora. Ambos son null si no aplican.
 */
public record ContadorCancelacionesDto(int count, int limit, int windowDays, Instant blockedUntil,
		Instant blockedUntilIfCancelled) {

	public static ContadorCancelacionesDto desde(Contador contador) {
		return new ContadorCancelacionesDto(contador.cancelaciones(), contador.limite(), contador.ventanaDias(),
				contador.bloqueadoHasta(), contador.bloqueadoHastaSiCancela());
	}
}
