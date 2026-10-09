package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TipoVehiculo {
	SEDAN("SEDAN"),
	HATCHBACK("HATCHBACK"),
	SUV("SUV"),
	VAN("VAN"),
	MOTO("MOTORCYCLE");

	private final String api;

	public static TipoVehiculo desdeApi(String api) {
		for (TipoVehiculo tipo : values()) {
			if (tipo.api.equals(api)) {
				return tipo;
			}
		}
		throw new IllegalArgumentException("Tipo de vehículo desconocido: " + api);
	}
}
