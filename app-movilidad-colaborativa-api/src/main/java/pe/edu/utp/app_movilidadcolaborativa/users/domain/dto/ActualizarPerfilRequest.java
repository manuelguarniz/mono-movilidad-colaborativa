package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.NombrePersona;

/**
 * El documento de identidad no lleva anotaciones: solo se valida mientras el usuario no tenga uno,
 * y eso depende del estado (ver PerfilService). El correo no es parte de la solicitud: si llega, se ignora.
 */
public record ActualizarPerfilRequest(
		@IdObjeto(message = "La foto de perfil no es válida") String photoFileId,
		@NotBlank(message = "Los nombres son obligatorios")
		@NombrePersona(message = "Los nombres deben tener al menos una letra y como máximo 60 caracteres")
		String firstName,
		@NotBlank(message = "Los apellidos son obligatorios")
		@NombrePersona(message = "Los apellidos deben tener al menos una letra y como máximo 60 caracteres")
		String lastName,
		String documentType,
		String documentNumber,
		@NotNull(message = "El teléfono es obligatorio")
		@Pattern(regexp = "^\\+51\\d{9}$", message = "El teléfono debe tener el formato +51 seguido de 9 dígitos")
		String phone,
		@NotNull(message = "La modalidad es obligatoria")
		@Pattern(regexp = "PASSENGER|DRIVER", message = "La modalidad no es válida") String activeMode) {

	// Los textos se recortan al construir la solicitud, antes de validarla; el documento va en mayúsculas.
	public ActualizarPerfilRequest {
		firstName = firstName == null ? null : firstName.trim();
		lastName = lastName == null ? null : lastName.trim();
		documentType = documentType == null ? null : documentType.trim().toUpperCase();
		documentNumber = documentNumber == null ? null : documentNumber.trim().toUpperCase();
		phone = phone == null ? null : phone.trim();
	}
}
