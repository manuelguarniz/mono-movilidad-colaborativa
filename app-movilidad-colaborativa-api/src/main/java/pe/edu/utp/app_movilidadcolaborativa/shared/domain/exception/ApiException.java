package pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception;

import lombok.Getter;

import java.util.Map;

/** Error de negocio con el código estable del contrato, que define su estado HTTP. */
@Getter
public class ApiException extends RuntimeException {

	private final CodigoError codigo;
	private final Map<String, Object> detalles;

	/** Para los códigos con mensaje fijo. */
	public ApiException(CodigoError codigo) {
		this(codigo, codigo.mensaje());
	}

	public ApiException(CodigoError codigo, String mensaje) {
		this(codigo, mensaje, null);
	}

	public ApiException(CodigoError codigo, String mensaje, Map<String, Object> detalles) {
		super(mensaje);
		this.codigo = codigo;
		this.detalles = detalles;
	}
}
