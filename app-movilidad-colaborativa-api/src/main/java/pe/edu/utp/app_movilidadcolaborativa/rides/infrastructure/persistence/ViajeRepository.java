package pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;

public interface ViajeRepository extends MongoRepository<Viaje, ObjectId> {
}
