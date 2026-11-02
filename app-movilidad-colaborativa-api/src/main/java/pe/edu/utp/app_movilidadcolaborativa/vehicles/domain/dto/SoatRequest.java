package pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.IdObjeto;

import java.time.LocalDate;

// RN-36. Que el SOAT esté vigente hoy y no dure más de 366 días lo valida VehiculoService. La foto del
// certificado es opcional hasta que exista la carga de imágenes.
public record SoatRequest(
		@NotBlank(message = "La aseguradora es obligatoria")
		@Size(max = 60, message = "La aseguradora debe tener como máximo 60 caracteres") String insurer,
		@NotBlank(message = "El número de póliza es obligatorio")
		@Pattern(regexp = "^[A-Za-z0-9-]{6,20}$",
				message = "El número de póliza debe tener de 6 a 20 letras, números o guiones") String policyNumber,
		@NotNull(message = "La fecha de inicio del SOAT es obligatoria") LocalDate startDate,
		@NotNull(message = "La fecha de fin del SOAT es obligatoria") LocalDate endDate,
		@IdObjeto(message = "La foto del SOAT no es válida") String photoFileId) {

	public SoatRequest {
		insurer = insurer == null ? null : insurer.trim();
		policyNumber = policyNumber == null ? null : policyNumber.trim().toUpperCase();
	}
}
