package pe.edu.utp.app_movilidadcolaborativa.infrastructure.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.edu.utp.app_movilidadcolaborativa.domain.dto.ErrorDto;
import pe.edu.utp.app_movilidadcolaborativa.domain.exception.ValidacionException;

/** Traduce las excepciones al cuerpo Error del contrato: { code, message, errors?, details? }. */
@Slf4j
@RestControllerAdvice
public class ManejadorErrores {

	private static final String VALIDATION_ERROR = "VALIDATION_ERROR";

	@ExceptionHandler(ValidacionException.class)
	public ResponseEntity<ErrorDto> validacion(ValidacionException ex) {
		return ResponseEntity.badRequest()
				.body(ErrorDto.deCampo(VALIDATION_ERROR, ex.getCampo(), ex.getMessage()));
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	public ResponseEntity<ErrorDto> parametroFaltante(MissingServletRequestParameterException ex) {
		String parametro = ex.getParameterName();
		return ResponseEntity.badRequest()
				.body(ErrorDto.deCampo(VALIDATION_ERROR, parametro, "El parámetro " + parametro + " es obligatorio"));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorDto> inesperado(Exception ex) {
		// Errores del propio Spring MVC (ruta inexistente, método no permitido, etc.): conservan su estado HTTP.
		if (ex instanceof ErrorResponse respuesta && respuesta.getStatusCode().is4xxClientError()) {
			HttpStatusCode estado = respuesta.getStatusCode();
			HttpStatus conocido = HttpStatus.resolve(estado.value());
			String codigo = estado.value() == 400 || conocido == null ? VALIDATION_ERROR : conocido.name();
			return ResponseEntity.status(estado).body(ErrorDto.de(codigo, "La solicitud no es válida"));
		}
		log.error("Error no controlado", ex);
		return ResponseEntity.internalServerError()
				.body(ErrorDto.de("INTERNAL_ERROR", "Ocurrió un error inesperado. Inténtalo nuevamente."));
	}
}
