package pe.edu.utp.app_movilidadcolaborativa.users.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** RN-03. Un valor nulo no es válido: la contraseña siempre es obligatoria. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ContrasenaSegura.Validador.class)
public @interface ContrasenaSegura {

	String message() default "La contraseña debe tener entre 8 y 72 caracteres con letras, números y símbolos";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador implements ConstraintValidator<ContrasenaSegura, String> {

		@Override
		public boolean isValid(String contrasena, ConstraintValidatorContext contexto) {
			return ReglasUsuario.esContrasenaValida(contrasena);
		}
	}
}
