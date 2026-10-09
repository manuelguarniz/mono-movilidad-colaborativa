package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** En MongoDB se guarda el nombre en español; la API expone el valor en inglés. */
@Getter
@RequiredArgsConstructor
public enum Rol {
	PASAJERO("PASSENGER"),
	CONDUCTOR("DRIVER");

	private final String api;
}
