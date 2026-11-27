package pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web.UsuarioActual;
import pe.edu.utp.app_movilidadcolaborativa.users.application.PerfilService;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.ActualizarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.CambiarModoRequest;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto;

/** Perfil del usuario autenticado; todas las rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UsuarioController {

	private final PerfilService perfilService;

	@GetMapping("/me")
	public PerfilUsuarioDto consultarPerfil(@UsuarioActual ObjectId usuarioId) {
		return perfilService.consultar(usuarioId);
	}

	@PutMapping("/me")
	public PerfilUsuarioDto actualizarPerfil(@UsuarioActual ObjectId usuarioId,
			@Valid @RequestBody ActualizarPerfilRequest solicitud) {
		return perfilService.actualizar(usuarioId, solicitud);
	}

	/** Cambio de modo confirmado en el modal del perfil (RN-48). */
	@PatchMapping("/me/mode")
	public PerfilUsuarioDto cambiarModo(@UsuarioActual ObjectId usuarioId,
			@Valid @RequestBody CambiarModoRequest solicitud) {
		return perfilService.cambiarModo(usuarioId, solicitud);
	}
}
