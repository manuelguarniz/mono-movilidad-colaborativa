package pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;

/**
 * RN-47. bookingId es la reserva del pasajero: si el autor es ese pasajero califica al conductor, y si es el conductor
 * califica a ese pasajero. El comentario en blanco se guarda como null.
 */
public record CalificarRequest(
		@NotNull(message = "Indica la reserva que calificas") @IdObjeto String bookingId,
		@NotNull(message = "Toca una estrella para calificar")
		@Min(value = 1, message = "Elige de 1 a 5 estrellas")
		@Max(value = 5, message = "Elige de 1 a 5 estrellas") Integer score,
		@Size(max = 200, message = "El comentario admite hasta 200 caracteres") String comment) {

	public CalificarRequest {
		comment = comment == null || comment.isBlank() ? null : comment.strip();
	}
}
