package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

/**
 * Vehículo del conductor, embebido en su usuario: no hay colección de vehículos.
 * La placa es única entre los usuarios que tienen vehículo (índice único parcial en vehiculo.placa).
 */
public record Vehiculo(
		@Indexed(unique = true, partialFilter = "{ 'vehiculo.placa': { $exists: true } }") String placa,
		TipoVehiculo tipo,
		String marca,
		String modelo,
		String color,
		Integer anio,
		Integer plazas,
		String dniPropietario,
		Boolean esPropietario,
		EstadoVehiculo estado,
		Foto foto,
		Instant fechaAceptacionTerminos,
		Instant fechaRegistro) {
}
