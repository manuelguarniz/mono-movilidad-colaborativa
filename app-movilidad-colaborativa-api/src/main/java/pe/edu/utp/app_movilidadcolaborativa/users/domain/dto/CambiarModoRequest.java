package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** PATCH /users/me/mode: la modalidad que el usuario confirmó en el modal del perfil (RN-48). */
public record CambiarModoRequest(
		@NotNull(message = "La modalidad es obligatoria")
		@Pattern(regexp = "PASSENGER|DRIVER", message = "La modalidad no es válida") String activeMode) {
}
