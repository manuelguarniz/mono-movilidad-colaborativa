package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

/** Estados de la reserva (README, sección 2.3). Activa = CONFIRMADA o EN_VIAJE. */
public enum EstadoReserva {
	CONFIRMADA,
	EN_VIAJE,
	CANCELADA,
	COMPLETADA,
	NO_SE_PRESENTO
}
