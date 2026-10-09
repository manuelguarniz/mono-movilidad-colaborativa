package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;

import java.time.Instant;
import java.util.List;

/**
 * Colección viajes. Conductor, vehículo y sede van copiados: el listado y el detalle salen de un solo documento.
 * El primer índice sirve al listado del dashboard; el segundo, a la actualización de las copias del conductor.
 */
@Builder
@Document("viajes")
@CompoundIndex(def = "{ 'estado': 1, 'sede.id': 1, 'fecha_salida': 1 }")
@CompoundIndex(def = "{ 'conductor.id': 1, 'estado': 1 }")
public record Viaje(
		@Id ObjectId id,
		ConductorViaje conductor,
		VehiculoViaje vehiculo,
		ReferenciaNombre sede,
		SentidoViaje sentido,
		Lugar origen,
		Lugar destino,
		List<Lugar> paradas,
		Double distanciaKm,
		Integer duracionMin,
		Instant fechaSalida,
		Integer precioPorPlaza,
		Integer plazasTotales,
		Integer plazasDisponibles,
		List<String> condiciones,
		EstadoViaje estado,
		Instant fechaCreacion,
		Instant fechaActualizacion) {
}
