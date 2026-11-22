package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.AsistenciaMovilidad;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoAsistencia;

import java.time.Instant;
import java.util.Objects;

/**
 * Necesidad de asistencia de movilidad que declara el usuario en P04 y P15 (RN-17). Solo se guarda con el
 * consentimiento marcado. Una nota vacía equivale a no enviarla. Es un dato sensible: no se escribe en los logs.
 */
public record AsistenciaRequest(
		@NotNull(message = "Elige el tipo de asistencia")
		@Pattern(regexp = "WHEELCHAIR|CRUTCHES_OR_WALKER|OTHER", message = "El tipo de asistencia no es válido")
		String type,
		@Size(max = 120, message = "La nota debe tener como máximo 120 caracteres") String note,
		@NotNull(message = "Para guardar tu asistencia debes autorizar compartirla, o apaga la opción.")
		@AssertTrue(message = "Para guardar tu asistencia debes autorizar compartirla, o apaga la opción.")
		Boolean consent) {

	public AsistenciaRequest {
		note = note == null || note.isBlank() ? null : note.trim();
	}

	/**
	 * La asistencia que se guarda. Si el tipo y la nota no cambiaron, se conserva la fecha del consentimiento
	 * anterior; si cambiaron, el consentimiento es de ahora.
	 */
	public AsistenciaMovilidad aAsistencia(AsistenciaMovilidad anterior, Instant ahora) {
		TipoAsistencia tipo = TipoAsistencia.desdeApi(type);
		if (anterior != null && anterior.tipo() == tipo && Objects.equals(anterior.nota(), note)
				&& anterior.fechaConsentimiento() != null) {
			return anterior;
		}
		return new AsistenciaMovilidad(tipo, note, ahora);
	}

	@Override
	public String toString() {
		// RNF-13: la nota nunca debe aparecer en un log, aunque se imprima la solicitud.
		return "AsistenciaRequest[type=" + type + ", note=***, consent=" + consent + "]";
	}
}
