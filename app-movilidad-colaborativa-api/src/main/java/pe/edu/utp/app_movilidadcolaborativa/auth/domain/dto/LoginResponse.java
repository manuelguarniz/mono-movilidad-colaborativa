package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.AlcanceToken;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.UsuarioSesionDto;

/**
 * Respuesta de login (RN-35). En el primer login: token PRE_AUTH y estado del OTP enviado (sin user).
 * En los siguientes: token SESSION y el usuario (sin otp).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(String token, AlcanceToken scope, long expiresIn, OtpInfoDto otp, UsuarioSesionDto user) {

	public static LoginResponse conOtp(TokenDto token, OtpInfoDto otp) {
		return new LoginResponse(token.token(), token.scope(), token.expiresIn(), otp, null);
	}

	public static LoginResponse conSesion(TokenDto token, UsuarioSesionDto user) {
		return new LoginResponse(token.token(), token.scope(), token.expiresIn(), null, user);
	}
}
