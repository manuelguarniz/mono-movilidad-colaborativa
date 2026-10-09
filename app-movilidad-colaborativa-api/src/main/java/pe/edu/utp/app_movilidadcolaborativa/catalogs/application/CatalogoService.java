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
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.Validacion;

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

	public List<DistritoDto> listarDistritos(String departmentId) {
		ObjectId id = aObjectId("departmentId", departmentId);
		return distritoRepository.findByDepartamentoIdOrderByNombreAsc(id).stream()
				.map(DistritoDto::desde)
				.toList();
	}

	public List<SedeDto> listarSedes(String districtId) {
		ObjectId id = aObjectId("districtId", districtId);
		return sedeRepository.findByDistritoIdAndActivaTrueOrderByNombreAsc(id).stream()
				.map(SedeDto::desde)
				.toList();
	}

	private static ObjectId aObjectId(String parametro, String valor) {
		if (valor == null || valor.isBlank()) {
			throw new ValidacionException(parametro, "El parámetro " + parametro + " es obligatorio");
		}
		if (!Validacion.esObjectId(valor)) {
			throw new ValidacionException(parametro, "El parámetro " + parametro + " no es un identificador válido");
		}
		return new ObjectId(valor);
	}
}
