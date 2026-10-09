package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ContrasenaSegura;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.CorreoUtp;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;

public record RegistroRequest(
		@NotBlank(message = "El correo es obligatorio") @CorreoUtp String email,
		@ContrasenaSegura String password,
		@NotNull(message = "Debes aceptar los términos y condiciones")
		@AssertTrue(message = "Debes aceptar los términos y condiciones") Boolean acceptedTerms) {

	// El correo se normaliza al construir la solicitud, antes de validarla.
	public RegistroRequest {
		email = ReglasUsuario.normalizarCorreo(email);
	}
}
