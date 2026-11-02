package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;

/**
 * Filtros del listado, todos opcionales (RF-03). Llegan como texto para que cada uno responda con su propio
 * mensaje. Sin campusId se listan todas las sedes (RN-49); accessible=true deja solo los vehículos aptos (RN-19).
 */
public record FiltroViajesRequest(
		@IdObjeto(message = "El parámetro campusId no es válido") String campusId,
		@Size(max = 100, message = "El destino debe tener como máximo 100 caracteres") String destination,
		@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora debe tener el formato HH:mm") String time,
		@Pattern(regexp = "^[1-9]\\d?$", message = "El número de pasajeros debe ser al menos 1") String passengers,
		@Pattern(regexp = "^(true|false)$", message = "El parámetro accessible debe ser true o false") String accessible,
		@Pattern(regexp = "^[1-9]\\d{0,3}$", message = "La página debe ser un número mayor o igual a 1") String page) {

	// Un destino vacío equivale a no filtrar.
	public FiltroViajesRequest {
		destination = destination == null || destination.isBlank() ? null : destination.trim();
	}

	public boolean soloAccesibles() {
		return "true".equals(accessible);
	}

	public int pagina() {
		return page == null ? 1 : Integer.parseInt(page);
	}
}
