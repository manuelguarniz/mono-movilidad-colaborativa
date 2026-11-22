package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import lombok.Builder;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.AsistenciaMovilidad;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoAsistencia;

import java.time.Instant;

/**
 * Colección reservas. El índice único parcial impide dos reservas CONFIRMADA del mismo pasajero
 * en un viaje y permite volver a reservar después de cancelar. canceladaPor y fechaCancelacion son null salvo en
 * CANCELADA. El segundo índice sirve al historial del pasajero (RF-09).
 */
@Builder
@Document("reservas")
@CompoundIndex(def = "{ 'viaje_id': 1, 'pasajero.id': 1 }", unique = true,
		partialFilter = "{ 'estado': 'CONFIRMADA' }")
@CompoundIndex(def = "{ 'pasajero.id': 1, 'viaje.fecha_salida': -1 }")
public record Reserva(
		@Id ObjectId id,
		ObjectId viajeId,
		ReferenciaNombre pasajero,
		ResumenViaje viaje,
		Integer plazas,
		Integer totalCreditos,
		/**
		 * Copia de la asistencia de movilidad del pasajero al reservar (RN-21), sin la fecha de consentimiento; null si
		 * no declaró ninguna o si la reserva es anterior al campo. Solo la ven el pasajero y el conductor (RN-22).
		 */
		Asistencia asistencia,
		EstadoReserva estado,
		/**
		 * false mientras sus créditos están retenidos; true cuando se reembolsan o se pagan al conductor (RN-40). Las
		 * reservas anteriores a la billetera no lo tienen (null): no retuvieron créditos, así que no se liquidan.
		 */
		Boolean liquidada,
		Actor canceladaPor,
		Instant fechaCancelacion,
		Instant fechaCreacion,
		Instant fechaActualizacion) {

	/** Foto del viaje al momento de reservar; no se actualiza. */
	public record ResumenViaje(String origen, String destino, Instant fechaSalida, String conductor,
			VehiculoResumen vehiculo) {
	}

	public record VehiculoResumen(String marca, String modelo, String color) {
	}

	/** Dato sensible (RNF-13): toString no muestra la nota, para que nunca termine en un log. */
	public record Asistencia(TipoAsistencia tipo, String nota) {

		public static Asistencia desde(AsistenciaMovilidad asistencia) {
			return asistencia == null || asistencia.tipo() == null ? null
					: new Asistencia(asistencia.tipo(), asistencia.nota());
		}

		@Override
		public String toString() {
			return "Asistencia[tipo=" + tipo + ", nota=***]";
		}
	}
}
