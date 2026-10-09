package pe.edu.utp.app_movilidadcolaborativa.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.annotation.Collation;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.domain.model.Distrito;

import java.util.List;

public interface DistritoRepository extends MongoRepository<Distrito, ObjectId> {

	@Collation("es")
	List<Distrito> findByDepartamentoIdOrderByNombreAsc(ObjectId departamentoId);
}
