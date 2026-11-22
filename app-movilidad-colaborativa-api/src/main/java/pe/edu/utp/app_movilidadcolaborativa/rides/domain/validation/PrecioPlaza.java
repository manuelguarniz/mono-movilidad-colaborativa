package pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.ValidadorParametrizado;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * RN-13: el precio por plaza está entre precio_minimo_plaza y precio_maximo_plaza créditos (RN-31).
 * Un valor nulo es válido: la obligatoriedad se declara con @NotNull.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PrecioPlaza.Validador.class)
public @interface PrecioPlaza {

	String message() default "El precio por plaza no es válido";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador extends ValidadorParametrizado<PrecioPlaza, Integer> {

		@Override
		protected String validar(Integer precio, Parametros parametros) {
			return precio >= parametros.precioMinimoPlaza() && precio <= parametros.precioMaximoPlaza() ? null
					: "El precio por plaza debe estar entre %d y %d".formatted(parametros.precioMinimoPlaza(),
							parametros.precioMaximoPlaza());
		}
	}
}
