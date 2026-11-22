package pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.ValidadorParametrizado;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

/**
 * RN-12: la salida es futura y su hora de Perú está entre hora_minima_salida y hora_maxima_salida (RN-31).
 * Un valor nulo es válido: la obligatoriedad se declara con @NotNull.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = HoraSalida.Validador.class)
public @interface HoraSalida {

	String message() default "La hora de salida no es válida";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validador extends ValidadorParametrizado<HoraSalida, Instant> {

		private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("H:mm");

		@Override
		protected String validar(Instant salida, Parametros parametros) {
			if (ReglasViaje.esHoraSalidaValida(salida, Instant.now(), parametros.horaMinimaSalida(),
					parametros.horaMaximaSalida())) {
				return null;
			}
			return "La hora de salida debe ser futura y estar entre las %s y las %s".formatted(
					HORA.format(parametros.horaMinimaSalida()), HORA.format(parametros.horaMaximaSalida()));
		}
	}
}
