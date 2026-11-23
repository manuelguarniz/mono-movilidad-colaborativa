package pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.Notificacion;

import java.time.Instant;

/** Una notificación de la bandeja (P18). assistance solo llega en NUEVA_RESERVA con asistencia (RN-22). */
public record NotificacionDto(String id, String type, String title, String message, String assistance,
		String rideId, String bookingId, boolean read, Instant createdAt) {

	public static NotificacionDto desde(Notificacion notificacion) {
		return new NotificacionDto(notificacion.id().toHexString(), notificacion.tipo().name(), notificacion.titulo(),
				notificacion.mensaje(), notificacion.asistencia(),
				notificacion.viajeId() == null ? null : notificacion.viajeId().toHexString(),
				notificacion.reservaId() == null ? null : notificacion.reservaId().toHexString(),
				Boolean.TRUE.equals(notificacion.leida()), notificacion.fechaCreacion());
	}
}
