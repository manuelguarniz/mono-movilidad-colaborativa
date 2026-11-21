package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Estados del retiro (README, sección 2.3). El operador pasa un PENDIENTE a PAGADO o RECHAZADO en la base de datos. */
@Getter
@RequiredArgsConstructor
public enum EstadoRetiro {
	PENDIENTE("PENDING"),
	PAGADO("PAID"),
	RECHAZADO("REJECTED");

	private final String api;
}
