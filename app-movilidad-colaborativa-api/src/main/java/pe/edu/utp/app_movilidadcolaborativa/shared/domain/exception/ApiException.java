package pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Map;

/** Error de negocio con el estado HTTP y el código estable del contrato. */
@Getter
public class ApiException extends RuntimeException {

	private final HttpStatus estado;
	private final String codigo;
	private final Map<String, Object> detalles;

	public ApiException(HttpStatus estado, String codigo, String mensaje) {
		this(estado, codigo, mensaje, null);
	}

	public ApiException(HttpStatus estado, String codigo, String mensaje, Map<String, Object> detalles) {
		super(mensaje);
		this.estado = estado;
		this.codigo = codigo;
		this.detalles = detalles;
	}
}
