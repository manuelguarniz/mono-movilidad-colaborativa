package pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation;

import java.time.Year;
import java.time.ZoneId;
import java.util.regex.Pattern;

/** Reglas de negocio del vehículo (RN-07 a RN-09). */
public final class ReglasVehiculo {

	public static final int ANIO_MINIMO = 2000;
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

	/** RN-08: como mínimo 2000 y como máximo el año actual. */
	public static boolean esAnioValido(Integer anio) {
		return anio != null && anio >= ANIO_MINIMO && anio <= Year.now(ZONA_PERU).getValue();
	}
}
