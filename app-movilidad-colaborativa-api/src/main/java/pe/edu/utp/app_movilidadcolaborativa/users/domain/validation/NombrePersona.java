package pe.edu.utp.app_movilidadcolaborativa.users.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** RN-05. Un valor nulo o vacío es válido: la obligatoriedad se declara con @NotBlank. */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NombrePersona.Validador.class)
public @interface NombrePersona {

	String message() default "Debe tener al menos una letra y como máximo 60 caracteres";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador implements ConstraintValidator<NombrePersona, String> {

		@Override
		public boolean isValid(String nombre, ConstraintValidatorContext contexto) {
			return nombre == null || nombre.isEmpty() || ReglasUsuario.esNombreValido(nombre);
		}
	}
}
