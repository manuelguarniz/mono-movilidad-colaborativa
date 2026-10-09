package pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Departamento;

public record DepartamentoDto(String id, String code, String name) {

	public static DepartamentoDto desde(Departamento departamento) {
		return new DepartamentoDto(departamento.id().toHexString(), departamento.codigo(), departamento.nombre());
	}
}
