package pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.Instant;

/** RN-12. Un valor nulo es válido: la obligatoriedad se declara con @NotNull. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = HoraSalida.Validador.class)
public @interface HoraSalida {

	String message() default "La hora de salida debe ser futura y estar entre las 6:00 y las 23:00";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador implements ConstraintValidator<HoraSalida, Instant> {

		@Override
		public boolean isValid(Instant salida, ConstraintValidatorContext contexto) {
			return salida == null || ReglasViaje.esHoraSalidaValida(salida, Instant.now());
		}
	}
}
