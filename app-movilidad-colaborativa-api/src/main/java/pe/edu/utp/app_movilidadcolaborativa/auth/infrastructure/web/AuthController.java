package pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.auth.application.AuthService;
import pe.edu.utp.app_movilidadcolaborativa.auth.application.RegistroService;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.CompletarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.LoginRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.LoginResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.ReenviarCodigoResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.RegistroRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.TokenUsuarioResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.VerificarCodigoRequest;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.MensajeDto;

/** El scope que exige cada ruta se define en SecurityConfig; el subject del JWT es el id del usuario. */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;
	private final RegistroService registroService;

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public TokenUsuarioResponse registrar(@Valid @RequestBody RegistroRequest solicitud) {
		return registroService.registrar(solicitud);
	}

	@PostMapping("/complete-profile")
	public MensajeDto completarPerfil(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CompletarPerfilRequest solicitud) {
		registroService.completarPerfil(usuarioId(jwt), solicitud);
		return new MensajeDto("Perfil completado correctamente");
	}

	@PostMapping("/login")
	public LoginResponse iniciarSesion(@Valid @RequestBody LoginRequest solicitud) {
		return authService.iniciarSesion(solicitud);
	}

	@PostMapping("/verify-code")
	public TokenUsuarioResponse verificarCodigo(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody VerificarCodigoRequest solicitud) {
		return authService.verificarCodigo(usuarioId(jwt), solicitud);
	}

	@PostMapping("/resend-code")
	public ReenviarCodigoResponse reenviarCodigo(@AuthenticationPrincipal Jwt jwt) {
		return authService.reenviarCodigo(usuarioId(jwt));
	}

	// La API es stateless: el cierre de sesión efectivo ocurre en el frontend al borrar el token.
	@PostMapping("/logout")
	public MensajeDto cerrarSesion() {
		return new MensajeDto("Sesión cerrada correctamente");
	}

	private static ObjectId usuarioId(Jwt jwt) {
		return new ObjectId(jwt.getSubject());
	}
}
