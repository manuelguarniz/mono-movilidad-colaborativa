package pe.edu.utp.app_movilidadcolaborativa.files.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.Archivo;

public interface ArchivoRepository extends MongoRepository<Archivo, ObjectId> {
}
