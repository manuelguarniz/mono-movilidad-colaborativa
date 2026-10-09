package pe.edu.utp.app_movilidadcolaborativa.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.application.catalogos.CatalogoService;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.DepartamentoDto;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.DistritoDto;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.ListaDto;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.SedeDto;

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
