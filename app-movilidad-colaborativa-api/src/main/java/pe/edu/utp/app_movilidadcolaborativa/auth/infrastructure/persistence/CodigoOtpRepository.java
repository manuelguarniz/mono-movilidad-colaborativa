package pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.persistence;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.CodigoOtp;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.PropositoOtp;

import java.util.Optional;

public interface CodigoOtpRepository extends MongoRepository<CodigoOtp, ObjectId> {

	Optional<CodigoOtp> findFirstByUsuarioIdAndPropositoOrderByFechaCreacionDesc(ObjectId usuarioId, PropositoOtp proposito);

	void deleteByUsuarioIdAndProposito(ObjectId usuarioId, PropositoOtp proposito);
}
