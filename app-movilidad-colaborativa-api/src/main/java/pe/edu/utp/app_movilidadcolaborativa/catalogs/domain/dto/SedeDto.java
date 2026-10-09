package pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Sede;

public record SedeDto(String id, String name) {

	public static SedeDto desde(Sede sede) {
		return new SedeDto(sede.id().toHexString(), sede.nombre());
	}
}
