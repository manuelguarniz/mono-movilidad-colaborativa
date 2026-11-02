package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Quién canceló una reserva o un viaje, o quién finalizó un viaje (cancelada_por, cancelado_por, finalizado_por). */
@Getter
@RequiredArgsConstructor
public enum Actor {
	PASAJERO("PASSENGER"),
	CONDUCTOR("DRIVER"),
	SISTEMA("SYSTEM");

	private final String api;
}
