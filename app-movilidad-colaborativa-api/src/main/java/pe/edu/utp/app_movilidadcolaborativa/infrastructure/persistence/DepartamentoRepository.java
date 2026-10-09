package pe.edu.utp.app_movilidadcolaborativa.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.annotation.Collation;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.domain.model.Departamento;

import java.util.List;

public interface DepartamentoRepository extends MongoRepository<Departamento, ObjectId> {

	// La colación "es" ordena las tildes como en español (Áncash antes que Arequipa).
	@Collation("es")
	List<Departamento> findAllByOrderByNombreAsc();
}
