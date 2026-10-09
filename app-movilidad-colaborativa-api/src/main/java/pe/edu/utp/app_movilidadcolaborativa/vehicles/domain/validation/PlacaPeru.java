package pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** RN-07. Un valor nulo o vacío es válido: la obligatoriedad se declara con @NotBlank. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PlacaPeru.Validador.class)
public @interface PlacaPeru {

	String message() default "La placa debe tener el formato ABC-123";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador implements ConstraintValidator<PlacaPeru, String> {

		@Override
		public boolean isValid(String placa, ConstraintValidatorContext contexto) {
			return placa == null || placa.isEmpty() || ReglasVehiculo.esPlacaValida(placa);
		}
	}
}
