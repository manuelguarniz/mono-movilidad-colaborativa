package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.AlcanceToken;

/** Respuesta de login: token PRE_AUTH y estado del código OTP enviado. */
public record LoginResponse(String token, AlcanceToken scope, long expiresIn, OtpInfoDto otp) {

	public static LoginResponse de(TokenDto token, OtpInfoDto otp) {
		return new LoginResponse(token.token(), token.scope(), token.expiresIn(), otp);
	}
}
