package pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;

public interface ReservaRepository extends MongoRepository<Reserva, ObjectId> {

	boolean existsByViajeIdAndPasajeroIdAndEstado(ObjectId viajeId, ObjectId pasajeroId, EstadoReserva estado);
}
