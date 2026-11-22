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
 * RN-09: los asientos son como mínimo 1 y como máximo max_asientos_vehiculo (RN-31). Un valor nulo es válido: la
 * obligatoriedad se declara con @NotNull.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AsientosVehiculo.Validador.class)
public @interface AsientosVehiculo {

	String message() default "Las plazas no son válidas";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador extends ValidadorParametrizado<AsientosVehiculo, Integer> {

		@Override
		protected String validar(Integer asientos, Parametros parametros) {
			return asientos >= 1 && asientos <= parametros.maxAsientosVehiculo() ? null
					: "Las plazas deben estar entre 1 y %d".formatted(parametros.maxAsientosVehiculo());
		}
	}
}
