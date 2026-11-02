package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto.CalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;

import java.time.Instant;
import java.util.List;

/**
 * Viajes PUBLICADO y EN_CURSO del conductor (dashboard 06-F y Mis viajes 17-B), con sus pasajeros y el contador de
 * cancelaciones (RN-30).
 */
public record MisViajesConductorDto(List<ViajePropioDto> data, ContadorCancelacionesDto cancellations) {

	/**
	 * Viaje con sus reservas activas y sus plazos: cancelar hasta cancellableUntil (RN-26) e iniciar entre
	 * startableFrom y startableUntil (RN-43).
	 */
	public record ViajePropioDto(ViajeResumenDto ride, List<PasajeroDto> passengers, Instant cancellableUntil,
			Instant startableFrom, Instant startableUntil) {
	}

	/** Reserva de un pasajero: status es CONFIRMED, IN_RIDE o NO_SHOW. usuario puede faltar si se borró la cuenta. */
	public record PasajeroDto(String bookingId, String id, String name, String photoUrl, CalificacionDto rating,
			Integer seats, Integer totalCredits, String status) {

		public static PasajeroDto desde(Reserva reserva, Usuario usuario) {
			return new PasajeroDto(reserva.id().toHexString(), reserva.pasajero().id().toHexString(),
					reserva.pasajero().nombre(),
					usuario == null || usuario.getFoto() == null ? null : usuario.getFoto().url(),
					usuario == null ? null : CalificacionDto.desde(usuario.getCalificacion()),
					reserva.plazas(), reserva.totalCreditos(),
					reserva.estado() == EstadoReserva.EN_VIAJE ? "IN_RIDE"
							: reserva.estado() == EstadoReserva.NO_SE_PRESENTO ? "NO_SHOW" : "CONFIRMED");
		}
	}
}
