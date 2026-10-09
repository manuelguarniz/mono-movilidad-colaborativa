package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Lugar;

/** Punto de una ruta, tanto en la solicitud como en la respuesta. */
public record LugarDto(
		@NotBlank(message = "El nombre del lugar es obligatorio")
		@Size(max = 80, message = "El nombre del lugar debe tener como máximo 80 caracteres") String label,
		@Size(max = 160, message = "La dirección debe tener como máximo 160 caracteres") String address,
		@NotNull(message = "La ubicación es obligatoria") @Valid PuntoDto location) {

	public record PuntoDto(
			@NotNull(message = "La latitud es obligatoria")
			@DecimalMin(value = "-90", message = "La latitud debe estar entre -90 y 90")
			@DecimalMax(value = "90", message = "La latitud debe estar entre -90 y 90") Double lat,
			@NotNull(message = "La longitud es obligatoria")
			@DecimalMin(value = "-180", message = "La longitud debe estar entre -180 y 180")
			@DecimalMax(value = "180", message = "La longitud debe estar entre -180 y 180") Double lng) {
	}

	// Los textos se recortan al construir la solicitud, antes de validarla; una dirección vacía no se guarda.
	public LugarDto {
		label = label == null ? null : label.trim();
		address = address == null || address.isBlank() ? null : address.trim();
	}

	// En el Point GeoJSON x es la longitud e y la latitud.
	public static LugarDto desde(Lugar lugar) {
		return new LugarDto(lugar.etiqueta(), lugar.direccion(),
				new PuntoDto(lugar.ubicacion().getY(), lugar.ubicacion().getX()));
	}

	public Lugar aLugar() {
		return new Lugar(label, address, new GeoJsonPoint(location.lng(), location.lat()));
	}
}
