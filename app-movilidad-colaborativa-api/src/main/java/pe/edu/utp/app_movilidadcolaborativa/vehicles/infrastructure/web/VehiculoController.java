package pe.edu.utp.app_movilidadcolaborativa.vehicles.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web.UsuarioActual;
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
	public VehiculoDto registrar(@UsuarioActual ObjectId usuarioId,
			@Valid @RequestBody RegistrarVehiculoRequest solicitud) {
		return vehiculoService.registrar(usuarioId, solicitud);
	}

	@GetMapping("/me")
	public VehiculoDto consultar(@UsuarioActual ObjectId usuarioId) {
		return vehiculoService.consultar(usuarioId);
	}

	@PutMapping("/me")
	public VehiculoDto actualizar(@UsuarioActual ObjectId usuarioId,
			@Valid @RequestBody ActualizarVehiculoRequest solicitud) {
		return vehiculoService.actualizar(usuarioId, solicitud);
	}
}
