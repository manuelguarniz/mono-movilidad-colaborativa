package pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.ValidadorParametrizado;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * RN-08: entre anio_minimo_vehiculo (RN-31) y el año actual. Un valor nulo es válido: la obligatoriedad se
 * declara con @NotNull.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AnioFabricacion.Validador.class)
public @interface AnioFabricacion {

	String message() default "El año de fabricación no es válido";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador extends ValidadorParametrizado<AnioFabricacion, Integer> {

		@Override
		protected String validar(Integer anio, Parametros parametros) {
			return ReglasVehiculo.esAnioValido(anio, parametros.anioMinimoVehiculo()) ? null
					: "El año de fabricación debe estar entre %d y el año actual".formatted(
							parametros.anioMinimoVehiculo());
		}
	}
}
