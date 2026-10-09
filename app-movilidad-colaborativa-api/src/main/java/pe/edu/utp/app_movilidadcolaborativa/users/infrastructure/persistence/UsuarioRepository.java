package pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, ObjectId> {

	Optional<Usuario> findByCorreo(String correo);

	boolean existsByCorreo(String correo);

	/** La placa ya pertenece a otro usuario. */
	boolean existsByVehiculoPlacaAndIdNot(String placa, ObjectId id);
}
