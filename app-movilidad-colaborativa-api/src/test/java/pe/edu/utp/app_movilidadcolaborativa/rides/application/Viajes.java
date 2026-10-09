package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.ConductorViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Lugar;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.SentidoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.VehiculoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** Viaje de ejemplo para las pruebas de los servicios: publicado, con 3 plazas y salida dentro de una hora. */
final class Viajes {

	static final ObjectId SEDE_ID = new ObjectId();

	private Viajes() {
	}

	static Viaje.ViajeBuilder publicado(ObjectId viajeId, ObjectId conductorId) {
		Instant ahora = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		return Viaje.builder()
				.id(viajeId)
				.conductor(new ConductorViaje(conductorId, "Carlos M.", "/uploads/perfiles/c.jpg",
						new Calificacion(4.9, 120)))
				.vehiculo(new VehiculoViaje("Toyota", "Yaris", "Blanco", "ABC-123"))
				.sede(new ReferenciaNombre(SEDE_ID, "UTP Sede Trujillo"))
				.sentido(SentidoViaje.REGRESO_CASA)
				.origen(new Lugar("UTP Sede Trujillo", "Av. Nicolás de Piérola", new GeoJsonPoint(-79.0353, -8.0975)))
				.destino(new Lugar("Huaca del Dragón", "La Esperanza, Trujillo", new GeoJsonPoint(-79.0412, -8.0716)))
				.paradas(List.of(new Lugar("Óvalo Papal", null, new GeoJsonPoint(-79.0389, -8.0851))))
				.distanciaKm(2.9)
				.duracionMin(5)
				.fechaSalida(ahora.plus(1, ChronoUnit.HOURS))
				.precioPorPlaza(5)
				.plazasTotales(3)
				.plazasDisponibles(3)
				.condiciones(List.of("No gritar"))
				.estado(EstadoViaje.PUBLICADO)
				.fechaCreacion(ahora)
				.fechaActualizacion(ahora);
	}
}
