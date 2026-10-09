package pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception;

import lombok.Getter;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;

import java.util.List;

/**
 * Datos de entrada que solo se pueden validar consultando el estado; se responde 400 VALIDATION_ERROR.
 * El formato de cada campo se declara con anotaciones en el DTO de la solicitud.
 */
@Getter
public class ValidacionException extends RuntimeException {

	private final List<ErrorCampo> errores;

	public ValidacionException(String campo, String mensaje) {
		super(mensaje);
		this.errores = List.of(new ErrorCampo(campo, mensaje));
	}
}
