package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record VerificarCodigoRequest(
		@NotNull(message = "El código debe tener 6 dígitos")
		@Pattern(regexp = "\\d{6}", message = "El código debe tener 6 dígitos") String code) {
}
