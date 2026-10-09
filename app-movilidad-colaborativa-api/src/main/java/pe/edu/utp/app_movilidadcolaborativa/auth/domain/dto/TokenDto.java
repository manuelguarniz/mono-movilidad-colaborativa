package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.AlcanceToken;

/** JWT emitido, con su scope y sus segundos de validez. */
public record TokenDto(String token, AlcanceToken scope, long expiresIn) {
}
