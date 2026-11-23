package pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto;

import java.util.List;

/** GET /notifications: las 50 más recientes y el total de no leídas (RF-13). */
public record BandejaDto(List<NotificacionDto> data, long unreadCount) {
}
