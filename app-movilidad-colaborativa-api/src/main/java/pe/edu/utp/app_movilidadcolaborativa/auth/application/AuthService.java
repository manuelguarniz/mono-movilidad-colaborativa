package pe.edu.utp.app_movilidadcolaborativa.auth.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.LoginRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.LoginResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.OtpInfoDto;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.ReenviarCodigoResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.TokenUsuarioResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.VerificarCodigoRequest;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.AlcanceToken;
import pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.security.JwtService;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.UsuarioSesionDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;

/**
 * Inicio de sesión (RF-01). El código OTP se pide solo en el primer login de la cuenta, el que
 * todavía no tiene ultima_conexion (RN-35); los siguientes logins entregan el token SESSION directo.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final OtpService otpService;
	private final JwtService jwtService;
	private final MongoTemplate mongoTemplate;

	/**
	 * Valida las credenciales. Si la cuenta ya inició sesión antes, registra la conexión y devuelve
	 * el token SESSION; si es su primer login, envía el OTP y devuelve un token PRE_AUTH.
	 */
	public LoginResponse iniciarSesion(LoginRequest solicitud) {
		Usuario usuario = usuarioRepository.findByCorreo(solicitud.email())
				.filter(encontrado -> passwordEncoder.matches(solicitud.password(), encontrado.getContrasenaHash()))
				.orElseThrow(() -> new ApiException(CodigoError.INVALID_CREDENTIALS,
						"Correo o contraseña incorrectos"));
		if (usuario.getEstado() == EstadoUsuario.BLOQUEADO) {
			throw new ApiException(CodigoError.ACCOUNT_BLOCKED,
					"Tu cuenta está bloqueada. Comunícate con soporte.");
		}

		if (usuario.getUltimaConexion() != null) {
			registrarConexion(usuario.getId());
			return LoginResponse.conSesion(jwtService.emitir(usuario.getId(), AlcanceToken.SESSION),
					UsuarioSesionDto.desde(usuario));
		}
		OtpInfoDto otp = otpService.emitir(usuario);
		return LoginResponse.conOtp(jwtService.emitir(usuario.getId(), AlcanceToken.PRE_AUTH), otp);
	}

	/**
	 * Segundo paso del primer login: verifica el OTP del usuario del token PRE_AUTH, registra la
	 * conexión (desde entonces ya no se pide OTP) y devuelve el token SESSION.
	 */
	public TokenUsuarioResponse verificarCodigo(ObjectId usuarioId, VerificarCodigoRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		otpService.verificar(usuarioId, solicitud.code());
		registrarConexion(usuarioId);
		return TokenUsuarioResponse.de(jwtService.emitir(usuarioId, AlcanceToken.SESSION),
				UsuarioSesionDto.desde(usuario));
	}

	public ReenviarCodigoResponse reenviarCodigo(ObjectId usuarioId) {
		OtpInfoDto otp = otpService.reenviar(buscarUsuario(usuarioId));
		return new ReenviarCodigoResponse("Código reenviado correctamente", otp);
	}

	// $set y no save(): Usuario no declara todos los campos del documento.
	private void registrarConexion(ObjectId usuarioId) {
		mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(usuarioId)),
				new Update().set("ultima_conexion", Instant.now()), Usuario.class);
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
