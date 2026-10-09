package pe.edu.utp.app_movilidadcolaborativa.files.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("archivos")
public record Archivo(
		@Id ObjectId id,
		ObjectId propietarioId,
		PropositoArchivo proposito,
		String ruta,
		String url,
		String tipoMime,
		long tamanoBytes,
		Instant fechaCreacion) {
}
