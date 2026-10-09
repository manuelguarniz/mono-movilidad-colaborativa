package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;

import java.util.Comparator;
import java.util.List;

import static pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError.INTERNAL_ERROR;
import static pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError.VALIDATION_ERROR;

/** Traduce las excepciones al cuerpo Error del contrato: { code, message, errors?, details? }. */
@Slf4j
@RestControllerAdvice
public class ManejadorErrores {

	/** Anotaciones de validación del DTO de la solicitud (@Valid). */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorDto> cuerpoInvalido(MethodArgumentNotValidException ex) {
		return validacion(ex.getBindingResult().getFieldErrors().stream()
				.sorted(Comparator.comparing(FieldError::getField))
				.map(error -> new ErrorCampo(error.getField(), error.getDefaultMessage()))
				.toList());
	}

	@ExceptionHandler(ValidacionException.class)
	public ResponseEntity<ErrorDto> validacion(ValidacionException ex) {
		return validacion(ex.getErrores());
	}

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<ErrorDto> negocio(ApiException ex) {
		return ResponseEntity.status(ex.getCodigo().estado())
				.body(new ErrorDto(ex.getCodigo().name(), ex.getMessage(), null, ex.getDetalles()));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorDto> cuerpoIlegible(HttpMessageNotReadableException ex) {
		return ResponseEntity.badRequest()
				.body(ErrorDto.de(VALIDATION_ERROR.name(), "El cuerpo de la solicitud no es un JSON válido"));
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	public ResponseEntity<ErrorDto> parametroFaltante(MissingServletRequestParameterException ex) {
		String parametro = ex.getParameterName();
		return validacion(List.of(new ErrorCampo(parametro, "El parámetro " + parametro + " es obligatorio")));
	}

	/** Parámetro con un tipo distinto al esperado, por ejemplo un identificador mal formado. */
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ErrorDto> parametroInvalido(MethodArgumentTypeMismatchException ex) {
		String parametro = ex.getName();
		return validacion(List.of(new ErrorCampo(parametro, "El parámetro " + parametro + " no es válido")));
	}

	// El mensaje general es fijo; el detalle de cada campo va en errors.
	private static ResponseEntity<ErrorDto> validacion(List<ErrorCampo> errores) {
		return ResponseEntity.badRequest()
				.body(ErrorDto.deCampos(VALIDATION_ERROR.name(), VALIDATION_ERROR.mensaje(), errores));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorDto> inesperado(Exception ex) {
		// Errores del propio Spring MVC (ruta inexistente, método no permitido, etc.): conservan su estado HTTP.
		if (ex instanceof ErrorResponse respuesta && respuesta.getStatusCode().is4xxClientError()) {
			HttpStatusCode estado = respuesta.getStatusCode();
			HttpStatus conocido = HttpStatus.resolve(estado.value());
			String codigo = estado.value() == 400 || conocido == null ? VALIDATION_ERROR.name() : conocido.name();
			return ResponseEntity.status(estado).body(ErrorDto.de(codigo, "La solicitud no es válida"));
		}
		log.error("Error no controlado", ex);
		return ResponseEntity.internalServerError()
				.body(ErrorDto.de(INTERNAL_ERROR.name(), INTERNAL_ERROR.mensaje()));
	}
}
