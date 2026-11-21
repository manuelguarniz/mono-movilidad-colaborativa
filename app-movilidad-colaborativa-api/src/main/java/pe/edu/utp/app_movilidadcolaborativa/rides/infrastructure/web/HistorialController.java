package pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.HistorialService;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;

/** Historial (RF-09); exige un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class HistorialController {

	private final HistorialService historialService;

	/** role es PASSENGER o DRIVER: un filtro del historial, no el modo activo (RN-48). */
	@GetMapping
	public HistorialDto consultar(@AuthenticationPrincipal Jwt jwt, @RequestParam String role,
			@RequestParam(defaultValue = "1") int page) {
		Rol rol;
		try {
			rol = Rol.desdeApi(role);
		} catch (IllegalArgumentException ex) {
			throw new ValidacionException("role", "El rol debe ser PASSENGER o DRIVER");
		}
		return historialService.consultar(new ObjectId(jwt.getSubject()), rol, Math.max(1, page));
	}
}
