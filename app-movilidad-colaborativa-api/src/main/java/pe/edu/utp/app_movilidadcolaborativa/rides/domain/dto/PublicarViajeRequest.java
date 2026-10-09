package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.HoraSalida;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

// RN-10 a RN-13. Que las plazas no superen las del vehículo depende del estado: lo valida ViajeService.
public record PublicarViajeRequest(
		@NotNull(message = "El sentido del viaje es obligatorio")
		@Pattern(regexp = "TO_CAMPUS|TO_HOME", message = "El sentido del viaje no es válido") String direction,
		@NotNull(message = "La hora de salida es obligatoria") @HoraSalida Instant departureTime,
		@NotNull(message = "El punto de partida es obligatorio") @Valid LugarDto origin,
		@NotNull(message = "El destino es obligatorio") @Valid LugarDto destination,
		@Size(max = ReglasViaje.MAXIMO_PARADAS, message = "Puedes agregar como máximo 5 paradas")
		List<@Valid LugarDto> stops,
		@NotNull(message = "El precio por plaza es obligatorio")
		@Min(value = 1, message = "El precio por plaza debe estar entre 1 y 10")
		@Max(value = 10, message = "El precio por plaza debe estar entre 1 y 10") Integer pricePerSeat,
		@NotNull(message = "Las plazas son obligatorias")
		@Min(value = 1, message = "Debes ofrecer al menos 1 plaza") Integer seats,
		@Size(max = ReglasViaje.MAXIMO_CONDICIONES, message = "Puedes agregar como máximo 10 condiciones")
		List<@NotBlank(message = "Cada condición debe tener entre 1 y 120 caracteres")
		@Size(max = 120, message = "Cada condición debe tener entre 1 y 120 caracteres") String> conditions) {

	// Las paradas y las condiciones son opcionales: sin ellas quedan como listas vacías.
	public PublicarViajeRequest {
		stops = stops == null ? List.of() : stops.stream().filter(Objects::nonNull).toList();
		conditions = conditions == null ? List.of()
				: conditions.stream().map(condicion -> condicion == null ? "" : condicion.trim()).toList();
	}
}
