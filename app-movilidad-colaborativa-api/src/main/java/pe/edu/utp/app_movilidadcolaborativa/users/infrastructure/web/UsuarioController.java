package pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.users.application.PerfilService;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.ActualizarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto;

/** Perfil del usuario autenticado; ambas rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UsuarioController {

	private final PerfilService perfilService;

	@GetMapping("/me")
	public PerfilUsuarioDto consultarPerfil(@AuthenticationPrincipal Jwt jwt) {
		return perfilService.consultar(usuarioId(jwt));
	}

	@PutMapping("/me")
	public PerfilUsuarioDto actualizarPerfil(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody ActualizarPerfilRequest solicitud) {
		return perfilService.actualizar(usuarioId(jwt), solicitud);
	}

	private static ObjectId usuarioId(Jwt jwt) {
		return new ObjectId(jwt.getSubject());
	}
}
