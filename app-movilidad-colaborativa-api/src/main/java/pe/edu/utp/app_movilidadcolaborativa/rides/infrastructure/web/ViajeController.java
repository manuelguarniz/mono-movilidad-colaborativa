package pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.MisViajesService;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.ReservaService;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.ViajeService;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.CancelarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.FiltroViajesRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.IniciarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ListadoViajesDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.MisViajesConductorDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.PublicarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ReservarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeDetalleDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.MensajeDto;

import java.net.URI;

/** Viajes y reservas; todas las rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/rides")
@RequiredArgsConstructor
public class ViajeController {

	private final ViajeService viajeService;
	private final ReservaService reservaService;
	private final MisViajesService misViajesService;

	@GetMapping
	public ListadoViajesDto listar(@AuthenticationPrincipal Jwt jwt,
			@Valid @ModelAttribute FiltroViajesRequest filtro) {
		return viajeService.listar(usuarioId(jwt), filtro);
	}

	@GetMapping("/mine")
	public MisViajesConductorDto listarPropios(@AuthenticationPrincipal Jwt jwt) {
		return misViajesService.viajesPropios(usuarioId(jwt));
	}

	@PostMapping
	public ResponseEntity<ViajeDetalleDto> publicar(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody PublicarViajeRequest solicitud, HttpServletRequest peticion) {
		ViajeDetalleDto viaje = viajeService.publicar(usuarioId(jwt), solicitud);
		// El context-path (/api) forma parte de la ruta del recurso creado.
		return ResponseEntity.created(URI.create(peticion.getContextPath() + "/rides/" + viaje.id())).body(viaje);
	}

	@GetMapping("/{rideId}")
	public ViajeDetalleDto consultar(@AuthenticationPrincipal Jwt jwt, @PathVariable ObjectId rideId) {
		return viajeService.consultar(usuarioId(jwt), rideId);
	}

	@PostMapping("/{rideId}/reserve")
	@ResponseStatus(HttpStatus.CREATED)
	public MensajeDto reservar(@AuthenticationPrincipal Jwt jwt, @PathVariable ObjectId rideId,
			@Valid @RequestBody(required = false) ReservarViajeRequest solicitud) {
		reservaService.reservar(usuarioId(jwt), rideId, solicitud == null ? 1 : solicitud.seats());
		return new MensajeDto("Reserva confirmada");
	}

	@PostMapping("/{rideId}/cancel")
	public MensajeDto cancelar(@AuthenticationPrincipal Jwt jwt, @PathVariable ObjectId rideId,
			@Valid @RequestBody(required = false) CancelarViajeRequest solicitud) {
		misViajesService.cancelarViaje(usuarioId(jwt), rideId, solicitud == null ? null : solicitud.reason());
		return new MensajeDto("Viaje cancelado");
	}

	@PostMapping("/{rideId}/start")
	public MensajeDto iniciar(@AuthenticationPrincipal Jwt jwt, @PathVariable ObjectId rideId,
			@Valid @RequestBody IniciarViajeRequest solicitud) {
		misViajesService.iniciar(usuarioId(jwt), rideId, solicitud.boardedBookingIds());
		return new MensajeDto("Viaje iniciado");
	}

	@PostMapping("/{rideId}/finish")
	public MensajeDto finalizar(@AuthenticationPrincipal Jwt jwt, @PathVariable ObjectId rideId) {
		misViajesService.finalizar(usuarioId(jwt), rideId);
		return new MensajeDto("Viaje completado");
	}

	private static ObjectId usuarioId(Jwt jwt) {
		return new ObjectId(jwt.getSubject());
	}
}
