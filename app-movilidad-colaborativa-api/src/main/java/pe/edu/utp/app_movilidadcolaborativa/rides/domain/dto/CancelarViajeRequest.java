package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import jakarta.validation.constraints.Size;

/** El cuerpo es opcional (RN-26). Un motivo vacío o en blanco se guarda como null. */
public record CancelarViajeRequest(
		@Size(max = 200, message = "El motivo debe tener como máximo 200 caracteres") String reason) {

	public CancelarViajeRequest {
		reason = reason == null || reason.isBlank() ? null : reason.strip();
	}
}
