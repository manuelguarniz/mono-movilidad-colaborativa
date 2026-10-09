package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;

import java.time.Instant;

public record VehiculoDto(
		String plate,
		String type,
		String brand,
		String model,
		String color,
		Integer year,
		Integer seats,
		String ownerDni,
		Boolean isOwner,
		String status,
		String photoUrl,
		Instant registeredAt) {

	public static VehiculoDto desde(Vehiculo vehiculo) {
		return new VehiculoDto(
				vehiculo.placa(),
				vehiculo.tipo() == null ? null : vehiculo.tipo().getApi(),
				vehiculo.marca(),
				vehiculo.modelo(),
				vehiculo.color(),
				vehiculo.anio(),
				vehiculo.plazas(),
				vehiculo.dniPropietario(),
				vehiculo.esPropietario(),
				vehiculo.estado() == null ? null : vehiculo.estado().getApi(),
				vehiculo.foto() == null ? null : vehiculo.foto().url(),
				vehiculo.fechaRegistro());
	}
}
