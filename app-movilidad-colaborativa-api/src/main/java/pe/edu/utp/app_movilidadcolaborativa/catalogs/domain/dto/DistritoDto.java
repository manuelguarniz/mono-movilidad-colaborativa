package pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Distrito;

public record DistritoDto(String id, String code, String name) {

	public static DistritoDto desde(Distrito distrito) {
		return new DistritoDto(distrito.id().toHexString(), distrito.codigo(), distrito.nombre());
	}
}
