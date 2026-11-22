package pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation;

import jakarta.validation.ConstraintViolation;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.LugarDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.PublicarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** RN-31: dentro de Spring, los validadores usan los parámetros de la colección app y no los fijos. */
class ValidadorParametrizadoTest {

	private final ParametrosService parametrosService = mock(ParametrosService.class);
	private final AnnotationConfigApplicationContext contexto = new AnnotationConfigApplicationContext();
	private final LocalValidatorFactoryBean validador = new LocalValidatorFactoryBean();

	ValidadorParametrizadoTest() {
		contexto.registerBean(ParametrosService.class, () -> parametrosService);
		contexto.refresh();
		validador.setApplicationContext(contexto);
		validador.afterPropertiesSet();
	}

	@AfterEach
	void cerrar() {
		validador.close();
		contexto.close();
	}

	@Test
	void losLimitesYLosMensajesSalenDeLaConfiguracion() {
		Parametros d = Parametros.POR_DEFECTO;
		when(parametrosService.leer()).thenReturn(new Parametros(d.maxCancelacionesConductor(),
				d.maxCancelacionesPasajero(), d.ventanaCancelacionesDias(), d.minutosLimiteCancelacion(),
				d.minutosInicioAnticipado(), d.minutosToleranciaInicio(), d.recargaMinima(), d.recargaMaxima(),
				d.retiroMinimo(), d.diasParaCalificar(), LocalTime.of(8, 0), LocalTime.of(20, 30), 2, 20, 1, 2,
				d.velocidadPromedioKmH(), d.anioMinimoVehiculo(), d.maxAsientosVehiculo(), d.maxDiasSoat()));
		// Mañana a las 7:00 de Perú: válida con los valores por defecto, no con el horario configurado.
		Instant salida = LocalDate.now(ReglasViaje.ZONA_PERU).plusDays(1).atTime(7, 0)
				.atZone(ReglasViaje.ZONA_PERU).toInstant();
		LugarDto lugar = new LugarDto("UTP Sede Trujillo", null, new LugarDto.PuntoDto(-8.0975, -79.0353));

		Map<String, String> errores = errores(new PublicarViajeRequest("TO_HOME", salida, lugar, lugar,
				List.of(lugar, lugar), 15, 3, List.of("Sin fumar", "Sin mascotas", "Puntual")));

		assertThat(errores).containsOnly(
				Map.entry("departureTime", "La hora de salida debe ser futura y estar entre las 8:00 y las 20:30"),
				Map.entry("stops", "Puedes agregar como máximo 1 paradas"),
				Map.entry("conditions", "Puedes agregar como máximo 2 condiciones"));

		assertThat(errores(new PublicarViajeRequest("TO_HOME", salida.plusSeconds(3600), lugar, lugar, List.of(), 1,
				3, List.of()))).containsOnly(Map.entry("pricePerSeat", "El precio por plaza debe estar entre 2 y 20"));
	}

	private Map<String, String> errores(PublicarViajeRequest solicitud) {
		return validador.validate(solicitud).stream().collect(Collectors.toMap(
				violacion -> violacion.getPropertyPath().toString(), ConstraintViolation::getMessage));
	}
}
