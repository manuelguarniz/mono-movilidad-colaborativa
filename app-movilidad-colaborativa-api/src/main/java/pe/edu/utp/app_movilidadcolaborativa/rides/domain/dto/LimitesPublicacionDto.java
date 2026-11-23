package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;

import java.time.format.DateTimeFormatter;

/**
 * Límites vigentes para publicar un viaje (colección app, RN-31), para que el formulario valide lo mismo que el
 * backend: horario de salida en hora de Perú "HH:mm" (RN-12; si departureFrom es posterior a departureTo, el
 * horario cruza la medianoche), precio por plaza (RN-13), paradas y condiciones (RN-10).
 */
public record LimitesPublicacionDto(String departureFrom, String departureTo, int minPrice, int maxPrice,
		int maxStops, int maxConditions) {

	private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

	public static LimitesPublicacionDto desde(Parametros parametros) {
		return new LimitesPublicacionDto(HORA.format(parametros.horaMinimaSalida()),
				HORA.format(parametros.horaMaximaSalida()), parametros.precioMinimoPlaza(),
				parametros.precioMaximoPlaza(), parametros.maxParadas(), parametros.maxCondiciones());
	}
}
