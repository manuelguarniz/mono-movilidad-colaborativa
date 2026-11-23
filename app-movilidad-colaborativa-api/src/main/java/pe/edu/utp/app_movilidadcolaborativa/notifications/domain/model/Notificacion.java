package pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Colección notificaciones (RF-13). mensaje se guarda ya armado con los datos del momento y no se actualiza.
 * asistencia es el texto «Necesita asistencia: …» de una NUEVA_RESERVA (solo para el conductor, RN-22); va aparte
 * porque la bandeja lo muestra en su propia línea, y es null en el resto. viajeId y reservaId son null cuando no
 * aplican (RETIRO_RECHAZADO). El índice TTL borra la notificación a los 30 días (RN-34).
 */
@Builder
@Document("notificaciones")
@CompoundIndex(name = "bandeja", def = "{ 'usuario_id': 1, 'leida': 1, 'fecha_creacion': -1 }")
public record Notificacion(
		@Id ObjectId id,
		ObjectId usuarioId,
		TipoNotificacion tipo,
		String titulo,
		String mensaje,
		String asistencia,
		ObjectId viajeId,
		ObjectId reservaId,
		Boolean leida,
		@Indexed(name = "expiracion", expireAfter = "30d") Instant fechaCreacion) {
}
