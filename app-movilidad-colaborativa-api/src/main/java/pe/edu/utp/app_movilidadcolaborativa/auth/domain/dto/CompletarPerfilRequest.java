package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

public record CompletarPerfilRequest(
		String photoFileId,
		String firstName,
		String lastName,
		String departmentId,
		String districtId,
		String campusId) {
}
