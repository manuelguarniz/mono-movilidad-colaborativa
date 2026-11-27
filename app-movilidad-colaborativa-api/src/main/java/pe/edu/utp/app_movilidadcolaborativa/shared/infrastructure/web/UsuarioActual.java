package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Inyecta en un parámetro {@code ObjectId} el id del usuario autenticado, que es el subject del JWT.
 * Lo resuelve {@link UsuarioActualArgumentResolver}.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface UsuarioActual {
}
