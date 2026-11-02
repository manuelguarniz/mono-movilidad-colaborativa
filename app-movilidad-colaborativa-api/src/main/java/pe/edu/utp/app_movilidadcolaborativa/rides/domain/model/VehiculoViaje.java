package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import java.time.Instant;

/**
 * Copia del vehículo dentro del viaje. apto_movilidad_reducida alimenta el filtro de RN-19 y soat_fecha_fin
 * permite mostrar la leyenda de RN-36 sin leer el perfil del conductor (null si no declaró SOAT).
 */
public record VehiculoViaje(
		String marca,
		String modelo,
		String color,
		String placa,
		Boolean aptoMovilidadReducida,
		Instant soatFechaFin) {
}
