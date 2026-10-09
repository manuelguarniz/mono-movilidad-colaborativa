package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.AlcanceToken;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.UsuarioSesionDto;

/** Respuesta de register (token REGISTRATION) y de verify-code (token SESSION). */
public record TokenUsuarioResponse(String token, AlcanceToken scope, long expiresIn, UsuarioSesionDto user) {

	public static TokenUsuarioResponse de(TokenDto token, UsuarioSesionDto user) {
		return new TokenUsuarioResponse(token.token(), token.scope(), token.expiresIn(), user);
	}
}
