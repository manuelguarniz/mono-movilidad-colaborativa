package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.CorreoUtp;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;

public record LoginRequest(
		@NotBlank(message = "El correo es obligatorio") @CorreoUtp String email,
		@NotEmpty(message = "La contraseña es obligatoria") String password) {

	// El correo se normaliza al construir la solicitud, antes de validarla.
	public LoginRequest {
		email = ReglasUsuario.normalizarCorreo(email);
	}
}
