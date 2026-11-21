package pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.LugarResumen;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Sede;

import java.time.Instant;
import java.util.List;

/**
 * Lo que necesita P20 para calificar un viaje: el resumen del viaje, el rol del usuario en él (role), el plazo
 * (deadline = fecha_fin + dias_para_calificar; open es false si ya venció) y a quiénes califica. Sin la calificación
 * actual de cada persona, para no influir en el puntaje (P20, «Supuestos a validar»).
 */
public record ContextoCalificacionDto(ViajeDto ride, String role, Instant deadline, boolean open,
		List<PersonaDto> targets) {

	public record ViajeDto(String id, Instant departureTime, Instant finishedAt, Sede campus, LugarResumen origin,
			LugarResumen destination) {
	}

	/**
	 * Persona a calificar. bookingId es el que se envía en POST /ratings. role es DRIVER o PASSENGER; seats solo en
	 * pasajeros y vehicle solo en el conductor. rated indica si el usuario ya la calificó en este viaje.
	 */
	public record PersonaDto(String bookingId, String userId, String name, String photoUrl, String role,
			Integer seats, VehiculoDto vehicle, boolean rated) {
	}

	public record VehiculoDto(String brand, String model, String color, String plate) {
	}
}
