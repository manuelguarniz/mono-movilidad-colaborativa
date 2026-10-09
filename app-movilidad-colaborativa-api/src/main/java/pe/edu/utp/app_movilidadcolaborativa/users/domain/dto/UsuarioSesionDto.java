package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;

import java.util.List;

/** Datos mínimos del usuario; firstName, lastName, photoUrl y activeMode son null con el perfil pendiente. */
public record UsuarioSesionDto(
		String id,
		String email,
		String firstName,
		String lastName,
		String photoUrl,
		List<String> roles,
		String activeMode,
		String status) {

	public static UsuarioSesionDto desde(Usuario usuario) {
		List<Rol> roles = usuario.getRoles() == null ? List.of() : usuario.getRoles();
		return new UsuarioSesionDto(
				usuario.getId().toHexString(),
				usuario.getCorreo(),
				usuario.getNombres(),
				usuario.getApellidos(),
				usuario.getFoto() == null ? null : usuario.getFoto().url(),
				roles.stream().map(Rol::getApi).toList(),
				usuario.getModoActivo() == null ? null : usuario.getModoActivo().getApi(),
				usuario.getEstado().getApi());
	}
}
