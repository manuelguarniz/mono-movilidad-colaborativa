package pe.edu.utp.app_movilidadcolaborativa.notifications.infrastructure.web;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.edu.utp.app_movilidadcolaborativa.notifications.application.NotificacionService;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.BandejaDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.NoLeidasDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.infrastructure.realtime.ConexionesSse;

/** Bandeja, contador y stream en tiempo real de RF-13; todas las rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificacionController {

	private final NotificacionService notificacionService;
	private final ConexionesSse conexiones;

	@GetMapping
	public BandejaDto bandeja(@AuthenticationPrincipal Jwt jwt) {
		return notificacionService.bandeja(usuarioId(jwt));
	}

	@GetMapping("/unread-count")
	public NoLeidasDto noLeidas(@AuthenticationPrincipal Jwt jwt) {
		return new NoLeidasDto(notificacionService.noLeidas(usuarioId(jwt)));
	}

	@PostMapping("/{notificationId}/read")
	public NoLeidasDto marcarLeida(@AuthenticationPrincipal Jwt jwt, @PathVariable ObjectId notificationId) {
		return new NoLeidasDto(notificacionService.marcarLeida(usuarioId(jwt), notificationId));
	}

	@PostMapping("/read-all")
	public NoLeidasDto marcarTodas(@AuthenticationPrincipal Jwt jwt) {
		return new NoLeidasDto(notificacionService.marcarTodas(usuarioId(jwt)));
	}

	/**
	 * Server-Sent Events: «unread-count» al conectar y cada vez que cambia, y «notification» con cada notificación
	 * nueva. El cliente envía el token en Authorization (con fetch), igual que en el resto de la API.
	 */
	@GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter stream(@AuthenticationPrincipal Jwt jwt, HttpServletResponse response) {
		// Sin caché ni buffer en proxies (nginx), para que cada evento salga en cuanto se escribe.
		response.setHeader("Cache-Control", "no-cache");
		response.setHeader("X-Accel-Buffering", "no");
		ObjectId usuarioId = usuarioId(jwt);
		return conexiones.abrir(usuarioId, jwt.getExpiresAt(), notificacionService.noLeidas(usuarioId));
	}

	private static ObjectId usuarioId(Jwt jwt) {
		return new ObjectId(jwt.getSubject());
	}
}
