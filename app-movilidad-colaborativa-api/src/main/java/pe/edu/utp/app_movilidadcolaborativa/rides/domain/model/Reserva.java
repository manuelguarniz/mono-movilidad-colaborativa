package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;

import java.time.Instant;

/**
 * Colección reservas. El índice único parcial impide dos reservas CONFIRMADA del mismo pasajero
 * en un viaje y permite volver a reservar después de cancelar.
 */
@Builder
@Document("reservas")
@CompoundIndex(def = "{ 'viaje_id': 1, 'pasajero.id': 1 }", unique = true,
		partialFilter = "{ 'estado': 'CONFIRMADA' }")
public record Reserva(
		@Id ObjectId id,
		ObjectId viajeId,
		ReferenciaNombre pasajero,
		ResumenViaje viaje,
		Integer plazas,
		Integer totalCreditos,
		EstadoReserva estado,
		Instant fechaCancelacion,
		Instant fechaCreacion,
		Instant fechaActualizacion) {

	/** Foto del viaje al momento de reservar; no se actualiza. */
	public record ResumenViaje(String origen, String destino, Instant fechaSalida, String conductor,
			VehiculoResumen vehiculo) {
	}

	public record VehiculoResumen(String marca, String modelo, String color) {
	}
}
