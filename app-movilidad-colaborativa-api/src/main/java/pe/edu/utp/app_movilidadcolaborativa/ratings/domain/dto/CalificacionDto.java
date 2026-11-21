package pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.model.CalificacionViaje;

import java.time.Instant;

/** Calificación recién registrada. Solo se devuelve a su autor, por eso lleva el comentario. */
public record CalificacionDto(String id, String rideId, String bookingId, String ratedUserId, String ratedRole,
		int score, String comment, Instant createdAt) {

	public static CalificacionDto desde(CalificacionViaje calificacion) {
		return new CalificacionDto(calificacion.id().toHexString(), calificacion.viajeId().toHexString(),
				calificacion.reservaId().toHexString(), calificacion.usuarioCalificadoId().toHexString(),
				calificacion.rolCalificado().getApi(), calificacion.puntaje(), calificacion.comentario(),
				calificacion.fechaCreacion());
	}
}
