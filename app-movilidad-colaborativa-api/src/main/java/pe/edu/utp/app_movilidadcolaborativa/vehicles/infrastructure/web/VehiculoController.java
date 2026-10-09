package pe.edu.utp.app_movilidadcolaborativa.vehicles.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.VehiculoDto;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.application.VehiculoService;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.ActualizarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.RegistrarVehiculoRequest;

/** El registro admite un token REGISTRATION o SESSION; el resto exige SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/vehicles")
@RequiredArgsConstructor
public class VehiculoController {

	private final VehiculoService vehiculoService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public VehiculoDto registrar(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody RegistrarVehiculoRequest solicitud) {
		return vehiculoService.registrar(usuarioId(jwt), solicitud);
	}

	@GetMapping("/me")
	public VehiculoDto consultar(@AuthenticationPrincipal Jwt jwt) {
		return vehiculoService.consultar(usuarioId(jwt));
	}

	@PutMapping("/me")
	public VehiculoDto actualizar(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody ActualizarVehiculoRequest solicitud) {
		return vehiculoService.actualizar(usuarioId(jwt), solicitud);
	}

	private static ObjectId usuarioId(Jwt jwt) {
		return new ObjectId(jwt.getSubject());
	}
}
