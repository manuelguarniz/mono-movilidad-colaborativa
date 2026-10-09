package pe.edu.utp.app_movilidadcolaborativa.infrastructure.server;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final String[] origenesPermitidos;

	public WebConfig(@Value("${app.cors.allowed-origins}") String[] origenesPermitidos) {
		this.origenesPermitidos = origenesPermitidos;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
				.allowedOrigins(origenesPermitidos)
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
				.allowedHeaders("*");
	}
}
