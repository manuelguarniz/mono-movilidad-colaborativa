package pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.MisViajesService;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisReservasDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.MensajeDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web.UsuarioActual;

/** Reservas del pasajero en Mis viajes (RF-06); todas las rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class ReservaController {

	private final MisViajesService misViajesService;

	@GetMapping("/mine")
	public MisReservasDto listarPropias(@UsuarioActual ObjectId usuarioId) {
		return misViajesService.reservasPropias(usuarioId);
	}

	@PostMapping("/{bookingId}/cancel")
	public MensajeDto cancelar(@UsuarioActual ObjectId usuarioId, @PathVariable ObjectId bookingId) {
		int devueltos = misViajesService.cancelarReserva(usuarioId, bookingId);
		// Una reserva anterior a la billetera no retuvo créditos: no hay nada que devolver.
		return new MensajeDto(devueltos == 0 ? "Reserva cancelada."
				: "Reserva cancelada. Te devolvimos %d %s.".formatted(devueltos, devueltos == 1 ? "crédito" : "créditos"));
	}
}
