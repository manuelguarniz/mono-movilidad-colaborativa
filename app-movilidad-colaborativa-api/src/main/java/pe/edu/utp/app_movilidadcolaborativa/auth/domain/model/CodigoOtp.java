package pe.edu.utp.app_movilidadcolaborativa.auth.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("codigos_otp")
public record CodigoOtp(
		@Id ObjectId id,
		@Indexed ObjectId usuarioId,
		String codigoHash,
		PropositoOtp proposito,
		int intentos,
		// Índice TTL: MongoDB elimina el documento al llegar la fecha de expiración.
		@Indexed(expireAfter = "0s") Instant fechaExpiracion,
		Instant fechaCreacion) {
}
