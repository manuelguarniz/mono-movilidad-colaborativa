package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Declaración del SOAT del vehículo (RN-36). Las fechas se guardan al inicio del día en hora de Perú.
 * La app no la verifica con terceros.
 */
public record Soat(
		String aseguradora,
		String numeroPoliza,
		Instant fechaInicio,
		Instant fechaFin,
		Foto foto,
		Instant fechaDeclaracion) {

	public static final ZoneId ZONA_PERU = ZoneId.of("America/Lima");

	public static Instant inicioDelDia(LocalDate fecha) {
		return fecha.atStartOfDay(ZONA_PERU).toInstant();
	}

	public static LocalDate fechaPeru(Instant instante) {
		return LocalDate.ofInstant(instante, ZONA_PERU);
	}

	/** SOAT vigente en una fecha = fecha_inicio ≤ fecha ≤ fecha_fin, en días de Perú. */
	public boolean vigenteEn(LocalDate fecha) {
		return !fecha.isBefore(fechaPeru(fechaInicio)) && !fecha.isAfter(fechaPeru(fechaFin));
	}
}
