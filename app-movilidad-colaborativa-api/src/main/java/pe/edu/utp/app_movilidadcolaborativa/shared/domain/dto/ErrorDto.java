package pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/** Cuerpo de toda respuesta 4xx o 5xx. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorDto(String code, String message, List<ErrorCampo> errors, Map<String, Object> details) {

	public record ErrorCampo(String field, String message) {
	}

	public static ErrorDto de(String code, String message) {
		return new ErrorDto(code, message, null, null);
	}

	public static ErrorDto deCampos(String code, String message, List<ErrorCampo> errors) {
		return new ErrorDto(code, message, errors, null);
	}
}
