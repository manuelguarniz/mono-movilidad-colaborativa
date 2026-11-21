package pe.edu.utp.app_movilidadcolaborativa.ratings.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;

import java.time.Instant;

/**
 * Colección calificaciones (RN-47): una calificación entre participantes de un viaje completado. El índice único
 * impide calificar dos veces a la misma persona en la misma reserva; el segundo sirve para recalcular el promedio
 * del calificado. reservaId es la reserva del pasajero, sea autor o calificado. comentario es opcional y solo lo ve
 * su autor (README, sección 1.1): ninguna respuesta dirigida a otro usuario lo expone. No se edita ni se borra.
 */
@Builder
@Document("calificaciones")
@CompoundIndex(name = "reserva_autor_calificado", unique = true,
		def = "{ 'reserva_id': 1, 'autor.id': 1, 'usuario_calificado_id': 1 }")
@CompoundIndex(name = "calificado", def = "{ 'usuario_calificado_id': 1 }")
public record CalificacionViaje(
		@Id ObjectId id,
		ObjectId viajeId,
		ObjectId reservaId,
		ReferenciaNombre autor,
		ObjectId usuarioCalificadoId,
		Rol rolCalificado,
		Integer puntaje,
		String comentario,
		Instant fechaCreacion) {
}
