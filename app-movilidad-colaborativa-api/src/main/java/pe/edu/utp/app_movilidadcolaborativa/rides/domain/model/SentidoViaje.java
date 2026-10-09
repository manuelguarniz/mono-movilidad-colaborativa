package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SentidoViaje {
	IDA_UNIVERSIDAD("TO_CAMPUS"),
	REGRESO_CASA("TO_HOME");

	private final String api;

	public static SentidoViaje desdeApi(String api) {
		for (SentidoViaje sentido : values()) {
			if (sentido.api.equals(api)) {
				return sentido;
			}
		}
		throw new IllegalArgumentException("Sentido de viaje desconocido: " + api);
	}
}
