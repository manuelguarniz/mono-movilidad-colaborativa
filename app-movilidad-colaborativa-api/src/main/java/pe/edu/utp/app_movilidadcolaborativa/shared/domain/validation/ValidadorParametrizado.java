package pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;

import java.lang.annotation.Annotation;

/**
 * Base de las validaciones cuyos límites están en la colección app (RN-31). Spring inyecta el servicio al crear
 * el validador; sin contexto de Spring (un Validator armado a mano) se usan los valores por defecto. El mensaje se
 * arma con los límites vigentes, así que reemplaza al de la anotación.
 */
public abstract class ValidadorParametrizado<A extends Annotation, T> implements ConstraintValidator<A, T> {

	@Autowired(required = false)
	private ParametrosService parametrosService;

	@Override
	public final boolean isValid(T valor, ConstraintValidatorContext contexto) {
		if (valor == null) {
			return true;
		}
		Parametros parametros = parametrosService == null ? Parametros.POR_DEFECTO : parametrosService.leer();
		String error = validar(valor, parametros);
		if (error == null) {
			return true;
		}
		contexto.disableDefaultConstraintViolation();
		contexto.buildConstraintViolationWithTemplate(escapar(error)).addConstraintViolation();
		return false;
	}

	/** Devuelve el mensaje de error, o null si el valor (nunca nulo) es válido. */
	protected abstract String validar(T valor, Parametros parametros);

	// Las llaves y el signo de dólar tienen significado en las plantillas de Bean Validation.
	private static String escapar(String mensaje) {
		return mensaje.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}").replace("$", "\\$");
	}
}
