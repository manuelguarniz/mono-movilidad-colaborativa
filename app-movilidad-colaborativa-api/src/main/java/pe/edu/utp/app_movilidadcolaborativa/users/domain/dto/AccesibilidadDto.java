package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Accesibilidad;

/** Checks de accesibilidad del vehículo (RN-18), en la solicitud y en la respuesta. */
public record AccesibilidadDto(Boolean wheelchair, Boolean boardingAssistance) {

	/** Un vehículo sin el campo guardado se muestra sin accesibilidad declarada. */
	public static AccesibilidadDto desde(Accesibilidad accesibilidad) {
		Accesibilidad valor = accesibilidad == null ? Accesibilidad.NINGUNA : accesibilidad;
		return new AccesibilidadDto(Boolean.TRUE.equals(valor.sillaRuedas()),
				Boolean.TRUE.equals(valor.ayudaAbordaje()));
	}

	public Accesibilidad aAccesibilidad() {
		return new Accesibilidad(Boolean.TRUE.equals(wheelchair), Boolean.TRUE.equals(boardingAssistance));
	}
}
