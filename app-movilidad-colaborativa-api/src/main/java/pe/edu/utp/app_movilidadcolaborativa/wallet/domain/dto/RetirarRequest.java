package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** RN-42. El mínimo (retiro_minimo) y el tope (saldo retirable) dependen del estado y se validan en el servicio. */
public record RetirarRequest(
		@NotNull(message = "El retiro mínimo es de 10 créditos.") Integer amount,
		@NotNull(message = "Ingresa un celular de 9 dígitos que empiece con 9.")
		@Pattern(regexp = "^9\\d{8}$", message = "Ingresa un celular de 9 dígitos que empiece con 9.")
		String yapePhone) {
}
