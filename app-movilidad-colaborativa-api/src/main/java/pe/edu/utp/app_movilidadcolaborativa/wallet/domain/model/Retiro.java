package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Colección retiros (RF-12). El índice único parcial permite un solo retiro PENDIENTE por usuario (RN-42). El operador
 * completa codigoOperacion o motivoRechazo y fechaResolucion; el job aplica la reversión de los rechazados y marca
 * reversionAplicada (null se trata como false).
 */
@Builder
@Document("retiros")
@CompoundIndexes({
		@CompoundIndex(name = "retiro_pendiente_unico", def = "{ 'usuario_id': 1 }", unique = true,
				partialFilter = "{ 'estado': 'PENDIENTE' }"),
		@CompoundIndex(name = "estado_reversion", def = "{ 'estado': 1, 'reversion_aplicada': 1 }")
})
public record Retiro(
		@Id ObjectId id,
		ObjectId usuarioId,
		Integer creditos,
		String celularYape,
		EstadoRetiro estado,
		String codigoOperacion,
		String motivoRechazo,
		Boolean reversionAplicada,
		Instant fechaSolicitud,
		Instant fechaResolucion) {

	/** «•••• 321» en la descripción y la franja de 21-F. */
	public static String ultimosTres(String celular) {
		return celular == null || celular.length() < 3 ? "" : celular.substring(celular.length() - 3);
	}
}
