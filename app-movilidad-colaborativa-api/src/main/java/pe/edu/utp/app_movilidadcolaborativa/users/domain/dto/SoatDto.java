package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Soat;

import java.time.Instant;
import java.time.LocalDate;

/** SOAT declarado por el conductor (RN-36). Las fechas son días de Perú. */
public record SoatDto(
		String insurer,
		String policyNumber,
		LocalDate startDate,
		LocalDate endDate,
		String photoUrl,
		Instant declaredAt) {

	public static SoatDto desde(Soat soat) {
		if (soat == null) {
			return null;
		}
		return new SoatDto(
				soat.aseguradora(),
				soat.numeroPoliza(),
				Soat.fechaPeru(soat.fechaInicio()),
				Soat.fechaPeru(soat.fechaFin()),
				soat.foto() == null ? null : soat.foto().url(),
				soat.fechaDeclaracion());
	}
}
