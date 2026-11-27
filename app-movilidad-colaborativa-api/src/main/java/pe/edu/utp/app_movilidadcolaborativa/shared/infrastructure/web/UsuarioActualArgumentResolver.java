package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web;

import org.bson.types.ObjectId;
import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** Convierte el subject del JWT autenticado en el {@code ObjectId} de los parámetros marcados con {@link UsuarioActual}. */
public class UsuarioActualArgumentResolver implements HandlerMethodArgumentResolver {

	@Override
	public boolean supportsParameter(MethodParameter parametro) {
		return parametro.hasParameterAnnotation(UsuarioActual.class)
				&& ObjectId.class.equals(parametro.getParameterType());
	}

	@Override
	public ObjectId resolveArgument(MethodParameter parametro, ModelAndViewContainer contenedor,
			NativeWebRequest solicitud, WebDataBinderFactory fabrica) {
		Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
		if (autenticacion == null || !(autenticacion.getPrincipal() instanceof Jwt jwt)) {
			throw new AuthenticationCredentialsNotFoundException("No hay un JWT autenticado");
		}
		return new ObjectId(jwt.getSubject());
	}
}
