package pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation;

import java.time.Year;
import java.time.ZoneId;
import java.util.regex.Pattern;

/**
 * Reglas de negocio del vehículo (RN-07 a RN-09 y RN-36). El año mínimo, los asientos máximos y la vigencia
 * máxima del SOAT están en la colección app (RN-31).
 */
public final class ReglasVehiculo {

	private static final Pattern PLACA = Pattern.compile("^[A-Z0-9]{3}-?[A-Z0-9]{3,4}$", Pattern.CASE_INSENSITIVE);
	private static final ZoneId ZONA_PERU = ZoneId.of("America/Lima");

	private ReglasVehiculo() {
	}

	/** RN-07: tres caracteres, guion opcional y tres o cuatro caracteres más. */
	public static boolean esPlacaValida(String placa) {
		return placa != null && PLACA.matcher(placa).matches();
	}

	/** La placa se guarda y se busca en mayúsculas y con guion (ABC-123). */
	public static String normalizarPlaca(String placa) {
		if (placa == null) {
			return null;
		}
		String limpia = placa.trim().toUpperCase();
		boolean faltaGuion = esPlacaValida(limpia) && limpia.charAt(3) != '-';
		return faltaGuion ? limpia.substring(0, 3) + "-" + limpia.substring(3) : limpia;
	}

	/** RN-08: como mínimo anioMinimo y como máximo el año actual. */
	public static boolean esAnioValido(Integer anio, int anioMinimo) {
		return anio != null && anio >= anioMinimo && anio <= Year.now(ZONA_PERU).getValue();
	}
}
