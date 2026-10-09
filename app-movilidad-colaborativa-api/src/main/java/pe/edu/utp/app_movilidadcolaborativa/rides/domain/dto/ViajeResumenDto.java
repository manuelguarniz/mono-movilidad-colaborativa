package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.ConductorViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Lugar;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.VehiculoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto.CalificacionDto;

import java.time.Instant;
import java.util.List;

/** Viaje en el listado del dashboard, sin coordenadas. Trae las condiciones para no pedirlas aparte. */
public record ViajeResumenDto(
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
		LugarResumen origin,
		LugarResumen destination) {

	public record Conductor(String id, String name, String photoUrl, CalificacionDto rating) {

		static Conductor desde(ConductorViaje conductor) {
			return new Conductor(conductor.id().toHexString(), conductor.nombre(), conductor.fotoUrl(),
					CalificacionDto.desde(conductor.calificacion()));
		}
	}

	public record Vehiculo(String brand, String model, String color, String plate) {

		static Vehiculo desde(VehiculoViaje vehiculo) {
			return new Vehiculo(vehiculo.marca(), vehiculo.modelo(), vehiculo.color(), vehiculo.placa());
		}
	}

	public record LugarResumen(String label, String address) {

		static LugarResumen desde(Lugar lugar) {
			return new LugarResumen(lugar.etiqueta(), lugar.direccion());
		}
	}

	public static ViajeResumenDto desde(Viaje viaje) {
		return new ViajeResumenDto(
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
				LugarResumen.desde(viaje.origen()),
				LugarResumen.desde(viaje.destino()));
	}
}
