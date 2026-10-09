package pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto;

import jakarta.validation.constraints.Min;

// El cuerpo es opcional: sin cuerpo o sin seats se reserva 1 plaza.
public record ReservarViajeRequest(@Min(value = 1, message = "Debes reservar al menos 1 plaza") Integer seats) {

	public ReservarViajeRequest {
		seats = seats == null ? 1 : seats;
	}
}
