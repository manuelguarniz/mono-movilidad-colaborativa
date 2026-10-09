package pe.edu.utp.app_movilidadcolaborativa.users.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** RN-01 y RN-02. Un valor nulo o vacío es válido: la obligatoriedad se declara con @NotBlank. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CorreoUtp.Validador.class)
public @interface CorreoUtp {

	String message() default "El correo debe ser del dominio utp.edu.pe";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador implements ConstraintValidator<CorreoUtp, String> {

		@Override
		public boolean isValid(String correo, ConstraintValidatorContext contexto) {
			return correo == null || correo.isEmpty() || ReglasUsuario.esCorreoUtp(correo);
		}
	}
}
