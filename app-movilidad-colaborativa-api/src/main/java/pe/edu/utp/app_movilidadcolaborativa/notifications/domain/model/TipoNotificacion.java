package pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Tipos de RF-13, cada uno con el título que muestra la bandeja (P18). */
@Getter
@RequiredArgsConstructor
public enum TipoNotificacion {
	NUEVA_RESERVA("Nueva reserva"),
	RESERVA_CANCELADA("Reserva cancelada"),
	VIAJE_CANCELADO("Viaje cancelado"),
	RECORDATORIO_SALIDA("Recordatorio de salida"),
	VIAJE_INICIADO("Viaje iniciado"),
	NO_SE_PRESENTO("No te presentaste"),
	VIAJE_COMPLETADO("Viaje completado"),
	RETIRO_RECHAZADO("Retiro rechazado");

	private final String titulo;
}
