package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EstadoViaje {
	PUBLICADO("PUBLISHED"),
	EN_CURSO("IN_PROGRESS"),
	COMPLETADO("COMPLETED"),
	CANCELADO("CANCELLED");

	private final String api;
}
