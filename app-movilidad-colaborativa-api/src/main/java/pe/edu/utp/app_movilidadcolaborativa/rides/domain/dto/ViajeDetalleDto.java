package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Conductor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;

import java.time.Instant;
import java.util.List;

/** Viaje con la ruta completa (origen, paradas y destino con coordenadas) para dibujar el mapa. */
public record ViajeDetalleDto(
		String id,
		String status,
		String direction,
		Instant departureTime,
		Integer pricePerSeat,
		Integer totalSeats,
		Integer availableSeats,
		Double distanceKm,
		Integer durationMin,
		Conductor driver,
		Vehiculo vehicle,
		List<String> conditions,
		LugarDto origin,
		LugarDto destination,
		List<LugarDto> stops,
		Instant createdAt) {

	public static ViajeDetalleDto desde(Viaje viaje) {
		return new ViajeDetalleDto(
				viaje.id().toHexString(),
				viaje.estado().getApi(),
				viaje.sentido().getApi(),
				viaje.fechaSalida(),
				viaje.precioPorPlaza(),
				viaje.plazasTotales(),
				viaje.plazasDisponibles(),
				viaje.distanciaKm(),
				viaje.duracionMin(),
				Conductor.desde(viaje.conductor()),
				Vehiculo.desde(viaje.vehiculo()),
				viaje.condiciones() == null ? List.of() : viaje.condiciones(),
				LugarDto.desde(viaje.origen()),
				LugarDto.desde(viaje.destino()),
				viaje.paradas() == null ? List.of() : viaje.paradas().stream().map(LugarDto::desde).toList(),
				viaje.fechaCreacion());
	}
}
