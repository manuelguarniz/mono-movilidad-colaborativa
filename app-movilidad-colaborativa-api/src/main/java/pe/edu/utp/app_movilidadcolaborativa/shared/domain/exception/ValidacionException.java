package pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception;

import lombok.Getter;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;

import java.util.List;

/** Uno o más datos de entrada no cumplen el contrato; se responde 400 VALIDATION_ERROR. */
@Getter
public class ValidacionException extends RuntimeException {

	private final List<ErrorCampo> errores;

	public ValidacionException(String mensaje, List<ErrorCampo> errores) {
		super(mensaje);
		this.errores = List.copyOf(errores);
	}

	public ValidacionException(String campo, String mensaje) {
		this(mensaje, List.of(new ErrorCampo(campo, mensaje)));
	}
}
