package pe.edu.utp.app_movilidadcolaborativa.application.catalogos;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.DepartamentoDto;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.DistritoDto;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.SedeDto;
import pe.edu.utp.app_movilidadcolaborativa.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.infrastructure.persistence.DepartamentoRepository;
import pe.edu.utp.app_movilidadcolaborativa.infrastructure.persistence.DistritoRepository;
import pe.edu.utp.app_movilidadcolaborativa.infrastructure.persistence.SedeRepository;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CatalogoService {

	private static final Pattern OBJECT_ID = Pattern.compile("^[0-9a-f]{24}$");

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
		if (!OBJECT_ID.matcher(valor).matches()) {
			throw new ValidacionException(parametro, "El parámetro " + parametro + " no es un identificador válido");
		}
		return new ObjectId(valor);
	}
}
