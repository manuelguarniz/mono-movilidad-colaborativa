package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/** Configuración propia de la aplicación: bloque app de application.yaml. */
@ConfigurationProperties("app")
public record AppProperties(Cors cors, Jwt jwt, Otp otp, Mail mail) {

	public record Cors(List<String> allowedOrigins) {
	}

	public record Jwt(String secret, Duration registrationTtl, Duration preAuthTtl, Duration sessionTtl) {
	}

	public record Otp(Duration ttl, int maxAttempts, Duration resendAfter) {
	}

	public record Mail(boolean enabled, String from) {
	}
}
