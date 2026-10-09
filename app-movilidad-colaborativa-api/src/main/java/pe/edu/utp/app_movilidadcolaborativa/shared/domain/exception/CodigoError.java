package pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception;

import org.springframework.http.HttpStatus;

/**
 * Códigos estables del campo code del contrato, cada uno con su estado HTTP.
 * Los errores transversales tienen además un mensaje fijo; el resto lo recibe al lanzarse.
 */
public enum CodigoError {

	VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Revisa los datos enviados"),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Tu sesión expiró. Vuelve a iniciar sesión."),
	FORBIDDEN_SCOPE(HttpStatus.FORBIDDEN, "No tienes permiso para realizar esta acción"),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado. Inténtalo nuevamente."),

	INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
	ACCOUNT_BLOCKED(HttpStatus.FORBIDDEN),
	EMAIL_ALREADY_REGISTERED(HttpStatus.CONFLICT),
	INVALID_CATALOG_REFERENCE(HttpStatus.BAD_REQUEST),
	INVALID_FILE_REFERENCE(HttpStatus.BAD_REQUEST),
	OTP_INVALID(HttpStatus.BAD_REQUEST),
	OTP_EXPIRED(HttpStatus.BAD_REQUEST),
	OTP_ATTEMPTS_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS),
	OTP_RESEND_TOO_SOON(HttpStatus.TOO_MANY_REQUESTS);

	private final HttpStatus estado;
	private final String mensaje;

	CodigoError(HttpStatus estado) {
		this(estado, null);
	}

	CodigoError(HttpStatus estado, String mensaje) {
		this.estado = estado;
		this.mensaje = mensaje;
	}

	public HttpStatus estado() {
		return estado;
	}

	/** Mensaje fijo del error, o null si depende del caso. */
	public String mensaje() {
		return mensaje;
	}
}
