package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Colección pagos: recarga simulada con Yape (RN-41). Nace APROBADO. referenciaProveedor es el código de operación,
 * único para no registrar dos veces la misma operación.
 */
@Builder
@Document("pagos")
public record Pago(
		@Id ObjectId id,
		ObjectId usuarioId,
		Integer montoCentimos,
		Integer creditos,
		Integer creditosPorSol,
		String metodo,
		String proveedor,
		@Indexed(unique = true) String referenciaProveedor,
		String estado,
		Instant fechaCreacion) {

	public static final String YAPE = "YAPE";
	public static final String SIMULADO = "SIMULADO";
	public static final String APROBADO = "APROBADO";
}
