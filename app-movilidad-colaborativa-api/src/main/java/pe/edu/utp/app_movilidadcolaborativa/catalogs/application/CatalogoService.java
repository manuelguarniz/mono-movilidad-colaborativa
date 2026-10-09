package pe.edu.utp.app_movilidadcolaborativa.catalogs.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto.DepartamentoDto;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto.DistritoDto;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto.SedeDto;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.DepartamentoRepository;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.DistritoRepository;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.SedeRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogoService {

	private final DepartamentoRepository departamentoRepository;
	private final DistritoRepository distritoRepository;
	private final SedeRepository sedeRepository;

	public List<DepartamentoDto> listarDepartamentos() {
		return departamentoRepository.findAllByOrderByNombreAsc().stream()
				.map(DepartamentoDto::desde)
				.toList();
	}

	public List<DistritoDto> listarDistritos(ObjectId departmentId) {
		return distritoRepository.findByDepartamentoIdOrderByNombreAsc(departmentId).stream()
				.map(DistritoDto::desde)
				.toList();
	}

	public List<SedeDto> listarSedes(ObjectId districtId) {
		return sedeRepository.findByDistritoIdAndActivaTrueOrderByNombreAsc(districtId).stream()
				.map(SedeDto::desde)
				.toList();
	}
}
