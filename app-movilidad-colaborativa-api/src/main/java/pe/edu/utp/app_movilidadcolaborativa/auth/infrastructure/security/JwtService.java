package pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.security;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.TokenDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.AlcanceToken;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config.AppProperties;

import java.time.Duration;
import java.time.Instant;

/** Emite los JWT: el subject es el id del usuario y el claim scope, el alcance del token. */
@Service
@RequiredArgsConstructor
public class JwtService {

	private final JwtEncoder jwtEncoder;
	private final AppProperties propiedades;

	public TokenDto emitir(ObjectId usuarioId, AlcanceToken alcance) {
		Duration vigencia = switch (alcance) {
			case REGISTRATION -> propiedades.jwt().registrationTtl();
			case PRE_AUTH -> propiedades.jwt().preAuthTtl();
			case SESSION -> propiedades.jwt().sessionTtl();
		};
		Instant ahora = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.subject(usuarioId.toHexString())
				.claim("scope", alcance.name())
				.issuedAt(ahora)
				.expiresAt(ahora.plus(vigencia))
				.build();
		JwsHeader cabecera = JwsHeader.with(MacAlgorithm.HS256).build();
		String token = jwtEncoder.encode(JwtEncoderParameters.from(cabecera, claims)).getTokenValue();
		return new TokenDto(token, alcance, vigencia.toSeconds());
	}
}
