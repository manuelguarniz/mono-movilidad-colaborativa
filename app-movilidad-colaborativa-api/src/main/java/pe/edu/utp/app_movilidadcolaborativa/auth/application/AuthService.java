package pe.edu.utp.app_movilidadcolaborativa.auth.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
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

/** Inicio de sesión en dos pasos: credenciales y código OTP (RF-01 a RF-04). */
@Service
@RequiredArgsConstructor
public class AuthService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final OtpService otpService;
	private final JwtService jwtService;

	/** Paso 1: valida las credenciales, envía el OTP y devuelve un token PRE_AUTH. */
	public LoginResponse iniciarSesion(LoginRequest solicitud) {
		Usuario usuario = usuarioRepository.findByCorreo(solicitud.email())
				.filter(encontrado -> passwordEncoder.matches(solicitud.password(), encontrado.getContrasenaHash()))
				.orElseThrow(() -> new ApiException(CodigoError.INVALID_CREDENTIALS,
						"Correo o contraseña incorrectos"));
		if (usuario.getEstado() == EstadoUsuario.BLOQUEADO) {
			throw new ApiException(CodigoError.ACCOUNT_BLOCKED,
					"Tu cuenta está bloqueada. Comunícate con soporte.");
		}

		OtpInfoDto otp = otpService.emitir(usuario);
		return LoginResponse.de(jwtService.emitir(usuario.getId(), AlcanceToken.PRE_AUTH), otp);
	}

	/** Paso 2: verifica el OTP del usuario del token PRE_AUTH y devuelve el token SESSION. */
	public TokenUsuarioResponse verificarCodigo(ObjectId usuarioId, VerificarCodigoRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		otpService.verificar(usuarioId, solicitud.code());
		return TokenUsuarioResponse.de(jwtService.emitir(usuarioId, AlcanceToken.SESSION),
				UsuarioSesionDto.desde(usuario));
	}

	public ReenviarCodigoResponse reenviarCodigo(ObjectId usuarioId) {
		OtpInfoDto otp = otpService.reenviar(buscarUsuario(usuarioId));
		return new ReenviarCodigoResponse("Código reenviado correctamente", otp);
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
