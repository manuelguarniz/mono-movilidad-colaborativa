package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.AlcanceToken;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

/**
 * Seguridad stateless con JWT (HS256). El claim scope del token llega como la autoridad
 * SCOPE_REGISTRATION, SCOPE_PRE_AUTH o SCOPE_SESSION, y cada ruta exige la suya.
 */
@Configuration
public class SecurityConfig {

	private static final String REGISTRATION = AlcanceToken.REGISTRATION.autoridad();
	private static final String PRE_AUTH = AlcanceToken.PRE_AUTH.autoridad();
	private static final String SESSION = AlcanceToken.SESSION.autoridad();
	private static final int LARGO_MINIMO_CLAVE = 32;

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		AuthenticationEntryPoint sinToken = (request, response, ex) -> escribirError(response,
				CodigoError.UNAUTHORIZED);
		AccessDeniedHandler sinPermiso = (request, response, ex) -> escribirError(response,
				CodigoError.FORBIDDEN_SCOPE);

		return http
				.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(rutas -> rutas
						.requestMatchers(HttpMethod.GET, "/catalogs/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login").permitAll()
						.requestMatchers("/auth/verify-code", "/auth/resend-code").hasAuthority(PRE_AUTH)
						.requestMatchers("/auth/complete-profile").hasAnyAuthority(REGISTRATION, SESSION)
						.anyRequest().hasAuthority(SESSION))
				.oauth2ResourceServer(oauth -> oauth
						.jwt(Customizer.withDefaults())
						.authenticationEntryPoint(sinToken)
						.accessDeniedHandler(sinPermiso))
				.exceptionHandling(errores -> errores
						.authenticationEntryPoint(sinToken)
						.accessDeniedHandler(sinPermiso))
				.build();
	}

	@Bean
	SecretKey claveJwt(AppProperties propiedades) {
		byte[] clave = propiedades.jwt().secret().getBytes(StandardCharsets.UTF_8);
		if (clave.length < LARGO_MINIMO_CLAVE) {
			throw new IllegalStateException("JWT_SECRET debe tener al menos " + LARGO_MINIMO_CLAVE + " caracteres");
		}
		return new SecretKeySpec(clave, "HmacSHA256");
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey claveJwt) {
		return NimbusJwtEncoder.withSecretKey(claveJwt).algorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	JwtDecoder jwtDecoder(SecretKey claveJwt) {
		return NimbusJwtDecoder.withSecretKey(claveJwt).macAlgorithm(MacAlgorithm.HS256).build();
	}

	/** BCrypt para las contraseñas y los códigos OTP (RNF-01). */
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(AppProperties propiedades) {
		CorsConfiguration cors = new CorsConfiguration();
		cors.setAllowedOrigins(propiedades.cors().allowedOrigins());
		cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		cors.setAllowedHeaders(List.of("*"));
		UrlBasedCorsConfigurationSource origen = new UrlBasedCorsConfigurationSource();
		origen.registerCorsConfiguration("/**", cors);
		return origen;
	}

	// Estos errores ocurren en el filtro, antes de llegar a ManejadorErrores; code y message son constantes.
	private static void escribirError(HttpServletResponse response, CodigoError codigo) throws IOException {
		response.setStatus(codigo.estado().value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write("{\"code\":\"" + codigo.name() + "\",\"message\":\"" + codigo.mensaje() + "\"}");
	}
}
