package pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** RN-08. Un valor nulo es válido: la obligatoriedad se declara con @NotNull. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AnioFabricacion.Validador.class)
public @interface AnioFabricacion {

	String message() default "El año de fabricación debe estar entre 2000 y el año actual";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador implements ConstraintValidator<AnioFabricacion, Integer> {

		@Override
		public boolean isValid(Integer anio, ConstraintValidatorContext contexto) {
			return anio == null || ReglasVehiculo.esAnioValido(anio);
		}
	}
}
