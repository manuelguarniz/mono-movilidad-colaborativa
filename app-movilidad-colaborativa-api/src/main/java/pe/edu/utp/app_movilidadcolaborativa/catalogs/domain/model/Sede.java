package pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.mapping.Document;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;

@Document("sedes")
public record Sede(
		@Id ObjectId id,
		String nombre,
		String institucion,
		String direccion,
		ReferenciaNombre distrito,
		GeoJsonPoint ubicacion,
		boolean activa) {

	/** Ciudad de la sede para el dashboard (RN-49): el nombre de su distrito. */
	public String ciudad() {
		return distrito == null ? null : distrito.nombre();
	}
}
