package pe.edu.utp.app_movilidadcolaborativa.auth.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.OtpInfoDto;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.CodigoOtp;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.PropositoOtp;
import pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.mail.NotificadorOtp;
import pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.persistence.CodigoOtpRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config.AppProperties;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/** Código OTP de inicio de sesión: 6 dígitos, un solo código vigente por usuario (RF-02, RF-03, RNF-03). */
@Service
@RequiredArgsConstructor
public class OtpService {

	private static final PropositoOtp PROPOSITO = PropositoOtp.INICIO_SESION;

	private final SecureRandom aleatorio = new SecureRandom();

	private final CodigoOtpRepository codigoOtpRepository;
	private final MongoTemplate mongoTemplate;
	private final PasswordEncoder passwordEncoder;
	private final NotificadorOtp notificadorOtp;
	private final AppProperties propiedades;

	/** Reemplaza el código vigente por uno nuevo, con los intentos en cero, y lo envía. */
	public OtpInfoDto emitir(Usuario usuario) {
		String codigo = "%06d".formatted(aleatorio.nextInt(1_000_000));
		Instant ahora = Instant.now();
		codigoOtpRepository.deleteByUsuarioIdAndProposito(usuario.getId(), PROPOSITO);
		codigoOtpRepository.insert(new CodigoOtp(null, usuario.getId(), passwordEncoder.encode(codigo), PROPOSITO, 0,
				ahora.plus(propiedades.otp().ttl()), ahora));
		notificadorOtp.enviar(usuario.getCorreo(), codigo);
		return new OtpInfoDto(propiedades.otp().ttl().toSeconds(), propiedades.otp().resendAfter().toSeconds(),
				propiedades.otp().maxAttempts());
	}

	/** Solo permite reenviar cuando ya pasó el tiempo de espera desde el último envío. */
	public OtpInfoDto reenviar(Usuario usuario) {
		Optional<CodigoOtp> vigente = buscarVigente(usuario.getId());
		if (vigente.isPresent()) {
			Instant permitido = vigente.get().fechaCreacion().plus(propiedades.otp().resendAfter());
			long espera = Duration.between(Instant.now(), permitido).toSeconds();
			if (espera > 0) {
				throw new ApiException(CodigoError.OTP_RESEND_TOO_SOON,
						"Podrás reenviar el código en " + espera + (espera == 1 ? " segundo" : " segundos"),
						Map.of("retryAfter", espera));
			}
		}
		return emitir(usuario);
	}

	/** Si el código es correcto lo elimina; si no, cuenta el intento y lo invalida al agotar el máximo. */
	public void verificar(ObjectId usuarioId, String codigo) {
		CodigoOtp otp = buscarVigente(usuarioId)
				.filter(vigente -> vigente.fechaExpiracion().isAfter(Instant.now()))
				.orElseThrow(() -> new ApiException(CodigoError.OTP_EXPIRED,
						"El código expiró. Solicita uno nuevo."));

		if (passwordEncoder.matches(codigo, otp.codigoHash())) {
			codigoOtpRepository.deleteById(otp.id());
			return;
		}

		// El incremento es atómico para que dos peticiones simultáneas no cuenten como un solo intento.
		CodigoOtp actualizado = mongoTemplate.findAndModify(
				Query.query(Criteria.where("_id").is(otp.id())),
				new Update().inc("intentos", 1),
				FindAndModifyOptions.options().returnNew(true),
				CodigoOtp.class);
		int intentos = actualizado == null ? propiedades.otp().maxAttempts() : actualizado.intentos();
		int restantes = propiedades.otp().maxAttempts() - intentos;
		if (restantes <= 0) {
			codigoOtpRepository.deleteById(otp.id());
			throw new ApiException(CodigoError.OTP_ATTEMPTS_EXCEEDED,
					"Agotaste los intentos. Solicita un nuevo código.");
		}
		throw new ApiException(CodigoError.OTP_INVALID,
				"Código inválido. " + (restantes == 1 ? "Te queda 1 intento." : "Te quedan " + restantes + " intentos."),
				Map.of("attemptsLeft", restantes));
	}

	private Optional<CodigoOtp> buscarVigente(ObjectId usuarioId) {
		return codigoOtpRepository.findFirstByUsuarioIdAndPropositoOrderByFechaCreacionDesc(usuarioId, PROPOSITO);
	}
}
