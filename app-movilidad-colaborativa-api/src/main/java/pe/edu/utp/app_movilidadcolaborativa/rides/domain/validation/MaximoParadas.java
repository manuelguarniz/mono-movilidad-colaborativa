package pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.ValidadorParametrizado;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.List;

/** RN-10: como máximo max_paradas paradas (RN-31). Un valor nulo es válido. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MaximoParadas.Validador.class)
public @interface MaximoParadas {

	String message() default "Hay demasiadas paradas";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador extends ValidadorParametrizado<MaximoParadas, List<?>> {

		@Override
		protected String validar(List<?> paradas, Parametros parametros) {
			return paradas.size() <= parametros.maxParadas() ? null
					: "Puedes agregar como máximo %d paradas".formatted(parametros.maxParadas());
		}
	}
}
