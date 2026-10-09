package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.NombrePersona;

// Mientras no exista POST /files la foto es opcional; si llega, se valida.
public record CompletarPerfilRequest(
		@IdObjeto(message = "La foto de perfil no es válida") String photoFileId,
		@NotBlank(message = "Los nombres son obligatorios")
		@NombrePersona(message = "Los nombres deben tener al menos una letra y como máximo 60 caracteres")
		String firstName,
		@NotBlank(message = "Los apellidos son obligatorios")
		@NombrePersona(message = "Los apellidos deben tener al menos una letra y como máximo 60 caracteres")
		String lastName,
		@NotNull(message = "El departamento es obligatorio")
		@IdObjeto(message = "El departamento no es válido") String departmentId,
		@NotNull(message = "El distrito es obligatorio")
		@IdObjeto(message = "El distrito no es válido") String districtId,
		@NotNull(message = "La sede es obligatoria")
		@IdObjeto(message = "La sede no es válida") String campusId) {

	// Nombres y apellidos se recortan al construir la solicitud, antes de validarla.
	public CompletarPerfilRequest {
		firstName = firstName == null ? null : firstName.trim();
		lastName = lastName == null ? null : lastName.trim();
	}
}
