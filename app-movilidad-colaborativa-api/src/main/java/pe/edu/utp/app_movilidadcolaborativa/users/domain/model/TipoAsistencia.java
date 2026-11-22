package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Tipos de asistencia de movilidad (RF-02, casuística B): «Silla de ruedas», «Muletas o andador» y «Otra». */
@Getter
@RequiredArgsConstructor
public enum TipoAsistencia {
	SILLA_RUEDAS("WHEELCHAIR"),
	MULETAS_ANDADOR("CRUTCHES_OR_WALKER"),
	OTRA("OTHER");

	private final String api;

	public static TipoAsistencia desdeApi(String api) {
		for (TipoAsistencia tipo : values()) {
			if (tipo.api.equals(api)) {
				return tipo;
			}
		}
		throw new IllegalArgumentException("Tipo de asistencia desconocido: " + api);
	}
}
