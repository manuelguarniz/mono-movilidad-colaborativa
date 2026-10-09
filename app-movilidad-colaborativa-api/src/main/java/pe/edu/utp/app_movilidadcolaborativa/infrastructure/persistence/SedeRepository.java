package pe.edu.utp.app_movilidadcolaborativa.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.annotation.Collation;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.domain.model.Sede;

import java.util.List;

public interface SedeRepository extends MongoRepository<Sede, ObjectId> {

	@Collation("es")
	List<Sede> findByDistritoIdAndActivaTrueOrderByNombreAsc(ObjectId distritoId);
}
