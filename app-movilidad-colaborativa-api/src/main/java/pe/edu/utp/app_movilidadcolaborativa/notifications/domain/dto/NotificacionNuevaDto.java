package pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto;

/** Dato del evento SSE «notification»: la notificación recién creada y el contador ya actualizado. */
public record NotificacionNuevaDto(NotificacionDto notification, long unreadCount) {
}
