package pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.application.CatalogoService;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto.DepartamentoDto;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto.DistritoDto;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto.SedeDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ListaDto;

@RestController
@RequestMapping("/catalogs")
@RequiredArgsConstructor
public class CatalogoController {

	private final CatalogoService catalogoService;

	@GetMapping("/departments")
	public ListaDto<DepartamentoDto> listarDepartamentos() {
		return new ListaDto<>(catalogoService.listarDepartamentos());
	}

	@GetMapping("/districts")
	public ListaDto<DistritoDto> listarDistritos(@RequestParam String departmentId) {
		return new ListaDto<>(catalogoService.listarDistritos(departmentId));
	}

	@GetMapping("/campuses")
	public ListaDto<SedeDto> listarSedes(@RequestParam String districtId) {
		return new ListaDto<>(catalogoService.listarSedes(districtId));
	}
}
