package pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.MisViajesService;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisReservasDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.MensajeDto;

/** Reservas del pasajero en Mis viajes (RF-06); todas las rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class ReservaController {

	private final MisViajesService misViajesService;

	@GetMapping("/mine")
	public MisReservasDto listarPropias(@AuthenticationPrincipal Jwt jwt) {
		return misViajesService.reservasPropias(usuarioId(jwt));
	}

	@PostMapping("/{bookingId}/cancel")
	public MensajeDto cancelar(@AuthenticationPrincipal Jwt jwt, @PathVariable ObjectId bookingId) {
		int devueltos = misViajesService.cancelarReserva(usuarioId(jwt), bookingId);
		return new MensajeDto("Reserva cancelada. Te devolvimos %d %s."
				.formatted(devueltos, devueltos == 1 ? "crédito" : "créditos"));
	}

	private static ObjectId usuarioId(Jwt jwt) {
		return new ObjectId(jwt.getSubject());
	}
}
