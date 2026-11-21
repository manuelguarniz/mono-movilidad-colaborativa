package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** RN-41. El rango del monto depende de los parámetros (recarga_minima, recarga_maxima) y se valida en el servicio. */
public record RecargarRequest(
		@NotNull(message = "Elige un monto entre S/ 5 y S/ 200.") Integer amount,
		@NotNull(message = "El código de operación tiene de 6 a 12 dígitos.")
		@Pattern(regexp = "^\\d{6,12}$", message = "El código de operación tiene de 6 a 12 dígitos.")
		String operationCode) {
}
