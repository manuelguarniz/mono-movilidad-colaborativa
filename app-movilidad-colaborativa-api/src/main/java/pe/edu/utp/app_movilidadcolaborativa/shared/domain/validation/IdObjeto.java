package pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import org.bson.types.ObjectId;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Identificador de MongoDB en texto. Un valor nulo es válido: la obligatoriedad se declara con @NotNull. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IdObjeto.Validador.class)
public @interface IdObjeto {

	String message() default "El identificador no es válido";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador implements ConstraintValidator<IdObjeto, String> {

		@Override
		public boolean isValid(String valor, ConstraintValidatorContext contexto) {
			return valor == null || ObjectId.isValid(valor);
		}
	}
}
