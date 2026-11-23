package pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation;

import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

/**
 * Reglas de negocio de la publicación y la búsqueda de viajes (RN-10 a RN-13). Los límites configurables
 * (horario de salida, velocidad promedio) llegan como argumento desde la colección app (RN-31).
 */
public final class ReglasViaje {

	public static final ZoneId ZONA_PERU = ZoneId.of("America/Lima");
	private static final double RADIO_TIERRA_KM = 6371.0088;
	private static final Map<Character, String> VARIANTES = Map.of(
			'a', "[aáàäâãAÁÀÄÂÃ]",
			'e', "[eéèëêEÉÈËÊ]",
			'i', "[iíìïîIÍÌÏÎ]",
			'o', "[oóòöôõOÓÒÖÔÕ]",
			'u', "[uúùüûUÚÙÜÛ]",
			'n', "[nñNÑ]");

	private ReglasViaje() {
	}

	/**
	 * RN-12: la salida es futura y su hora de Perú está entre horaMinima y horaMaxima, ambas incluidas. Si
	 * horaMinima es posterior a horaMaxima, el horario cruza la medianoche (p. ej. 22:00 a 02:00).
	 */
	public static boolean esHoraSalidaValida(Instant salida, Instant ahora, LocalTime horaMinima,
			LocalTime horaMaxima) {
		if (salida == null || !salida.isAfter(ahora)) {
			return false;
		}
		LocalTime hora = salida.atZone(ZONA_PERU).toLocalTime();
		boolean desdeMinima = !hora.isBefore(horaMinima);
		boolean hastaMaxima = !hora.isAfter(horaMaxima);
		return horaMinima.isAfter(horaMaxima) ? desdeMinima || hastaMaxima : desdeMinima && hastaMaxima;
	}

	/** Distancia en línea recta entre los puntos consecutivos de la ruta, con un decimal. */
	public static double distanciaKm(List<GeoJsonPoint> ruta) {
		double total = 0;
		for (int i = 1; i < ruta.size(); i++) {
			total += tramoKm(ruta.get(i - 1), ruta.get(i));
		}
		return Math.round(total * 10) / 10.0;
	}

	/**
	 * Duración estimada a partir de la distancia y la velocidad media urbana, mientras no haya un servicio de
	 * rutas; como mínimo un minuto.
	 */
	public static int duracionMin(double distanciaKm, double velocidadKmH) {
		return Math.max(1, (int) Math.ceil(distanciaKm / velocidadKmH * 60));
	}

	/** Expresión regular que encuentra el texto sin distinguir tildes; se usa sin distinguir mayúsculas (opción i). */
	public static String patronSinTildes(String texto) {
		String sinTildes = Normalizer.normalize(texto.trim().toLowerCase(), Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "");
		StringBuilder patron = new StringBuilder();
		for (char letra : sinTildes.toCharArray()) {
			if (VARIANTES.containsKey(letra)) {
				patron.append(VARIANTES.get(letra));
			} else if (Character.isLetterOrDigit(letra)) {
				patron.append(letra);
			} else if (Character.isWhitespace(letra)) {
				patron.append("\\s+");
			} else {
				patron.append('\\').append(letra);
			}
		}
		return patron.toString();
	}

	// Fórmula del haversine; en el Point GeoJSON x es la longitud e y la latitud.
	private static double tramoKm(GeoJsonPoint desde, GeoJsonPoint hasta) {
		double latitud = Math.toRadians(hasta.getY() - desde.getY());
		double longitud = Math.toRadians(hasta.getX() - desde.getX());
		double a = Math.pow(Math.sin(latitud / 2), 2) + Math.cos(Math.toRadians(desde.getY()))
				* Math.cos(Math.toRadians(hasta.getY())) * Math.pow(Math.sin(longitud / 2), 2);
		return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(a));
	}
}
