package pe.edu.utp.app_movilidadcolaborativa.ratings.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.ratings.application.CalificacionService;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.CalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.CalificarRequest;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.ContextoCalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web.UsuarioActual;

/** Calificaciones (RF-10, RN-47); todas las rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/ratings")
@RequiredArgsConstructor
public class CalificacionController {

	private final CalificacionService calificacionService;

	@GetMapping("/rides/{rideId}")
	public ContextoCalificacionDto contexto(@UsuarioActual ObjectId usuarioId, @PathVariable ObjectId rideId) {
		return calificacionService.contexto(usuarioId, rideId);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CalificacionDto calificar(@UsuarioActual ObjectId usuarioId, @Valid @RequestBody CalificarRequest solicitud) {
		return calificacionService.calificar(usuarioId, solicitud);
	}
}
