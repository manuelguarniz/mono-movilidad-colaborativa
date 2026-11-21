package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Colección movimientos_creditos: libro de solo inserción (RNF-17). monto lleva el signo y saldoPosterior es el
 * saldo disponible después del movimiento. Cada movimiento referencia su origen (pago, reserva, viaje o retiro).
 */
@Builder
@Document("movimientos_creditos")
@CompoundIndex(name = "usuario_fecha", def = "{ 'usuario_id': 1, 'fecha_creacion': -1 }")
public record MovimientoCredito(
		@Id ObjectId id,
		ObjectId usuarioId,
		TipoMovimiento tipo,
		Integer monto,
		Integer saldoPosterior,
		String descripcion,
		ObjectId pagoId,
		ObjectId reservaId,
		ObjectId viajeId,
		ObjectId retiroId,
		Instant fechaCreacion) {
}
