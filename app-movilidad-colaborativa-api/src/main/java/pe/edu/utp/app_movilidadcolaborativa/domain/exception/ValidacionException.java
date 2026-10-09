package pe.edu.utp.app_movilidadcolaborativa.domain.exception;

import lombok.Getter;

/** Un dato de entrada no cumple el contrato; se responde 400 VALIDATION_ERROR. */
@Getter
public class ValidacionException extends RuntimeException {

	private final String campo;

	public ValidacionException(String campo, String mensaje) {
		super(mensaje);
		this.campo = campo;
	}
}
