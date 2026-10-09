package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;

/** Filtros del listado, todos opcionales. Llegan como texto para que cada uno responda con su propio mensaje. */
public record FiltroViajesRequest(
		@IdObjeto(message = "El parámetro campusId no es válido") String campusId,
		@Size(max = 100, message = "El destino debe tener como máximo 100 caracteres") String destination,
		@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora debe tener el formato HH:mm") String time,
		@Pattern(regexp = "^[1-9]\\d?$", message = "El número de pasajeros debe ser al menos 1") String passengers) {

	// Un destino vacío equivale a no filtrar.
	public FiltroViajesRequest {
		destination = destination == null || destination.isBlank() ? null : destination.trim();
	}
}
