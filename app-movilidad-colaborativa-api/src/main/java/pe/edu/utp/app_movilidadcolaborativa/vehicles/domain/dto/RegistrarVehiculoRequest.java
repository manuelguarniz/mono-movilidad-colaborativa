package pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation.AnioFabricacion;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation.PlacaPeru;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation.ReglasVehiculo;

// RN-06: todo es obligatorio, excepto la casilla «Soy el propietario» y la foto.
public record RegistrarVehiculoRequest(
		@NotBlank(message = "La placa es obligatoria") @PlacaPeru String plate,
		@NotNull(message = "El tipo de vehículo es obligatorio")
		@Pattern(regexp = "SEDAN|HATCHBACK|SUV|VAN|MOTORCYCLE", message = "El tipo de vehículo no es válido")
		String type,
		@NotBlank(message = "La marca es obligatoria")
		@Size(max = 40, message = "La marca debe tener como máximo 40 caracteres") String brand,
		@NotBlank(message = "El modelo es obligatorio")
		@Size(max = 40, message = "El modelo debe tener como máximo 40 caracteres") String model,
		@NotBlank(message = "El color es obligatorio")
		@Size(max = 30, message = "El color debe tener como máximo 30 caracteres") String color,
		@NotNull(message = "El año de fabricación es obligatorio") @AnioFabricacion Integer year,
		@NotNull(message = "Las plazas son obligatorias")
		@Min(value = 1, message = "Las plazas deben estar entre 1 y 10")
		@Max(value = 10, message = "Las plazas deben estar entre 1 y 10") Integer seats,
		@NotNull(message = "El DNI del propietario es obligatorio")
		@Pattern(regexp = "^\\d{8}$", message = "El DNI debe tener 8 dígitos") String ownerDni,
		Boolean isOwner,
		@NotNull(message = "Debes aceptar los términos y condiciones")
		@AssertTrue(message = "Debes aceptar los términos y condiciones") Boolean acceptedTerms,
		@IdObjeto(message = "La foto del vehículo no es válida") String photoFileId) {

	// La placa se normaliza y los textos se recortan al construir la solicitud, antes de validarla.
	public RegistrarVehiculoRequest {
		plate = ReglasVehiculo.normalizarPlaca(plate);
		brand = brand == null ? null : brand.trim();
		model = model == null ? null : model.trim();
		color = color == null ? null : color.trim();
		ownerDni = ownerDni == null ? null : ownerDni.trim();
	}
}
