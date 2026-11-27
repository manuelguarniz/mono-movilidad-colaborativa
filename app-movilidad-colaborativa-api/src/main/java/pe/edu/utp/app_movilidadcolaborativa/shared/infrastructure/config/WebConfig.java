package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web.UsuarioActualArgumentResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(new UsuarioActualArgumentResolver());
	}
}
