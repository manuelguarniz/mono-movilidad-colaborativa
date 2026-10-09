package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EstadoVehiculo {
	ACTIVO("ACTIVE"),
	INACTIVO("INACTIVE");

	private final String api;
}
