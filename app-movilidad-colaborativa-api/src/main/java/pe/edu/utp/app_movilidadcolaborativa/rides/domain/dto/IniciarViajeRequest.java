package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import jakarta.validation.constraints.NotNull;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;

import java.util.List;

/** Reservas cuyos pasajeros subieron (17-E); las CONFIRMADA que no estén pasan a NO_SE_PRESENTO (RN-43). */
public record IniciarViajeRequest(
		@NotNull(message = "Indica qué pasajeros subieron")
		List<@NotNull(message = "El identificador no es válido") @IdObjeto String> boardedBookingIds) {
}
