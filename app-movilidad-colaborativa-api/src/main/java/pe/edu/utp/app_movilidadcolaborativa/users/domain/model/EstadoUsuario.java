package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EstadoUsuario {
	PERFIL_PENDIENTE("PROFILE_PENDING"),
	ACTIVO("ACTIVE"),
	BLOQUEADO("BLOCKED");

	private final String api;
}
