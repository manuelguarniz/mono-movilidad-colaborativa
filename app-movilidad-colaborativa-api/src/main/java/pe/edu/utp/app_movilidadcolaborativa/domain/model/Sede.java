package pe.edu.utp.app_movilidadcolaborativa.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("sedes")
public record Sede(
		@Id ObjectId id,
		String nombre,
		String institucion,
		String direccion,
		ReferenciaNombre distrito,
		GeoJsonPoint ubicacion,
		boolean activa) {
}
