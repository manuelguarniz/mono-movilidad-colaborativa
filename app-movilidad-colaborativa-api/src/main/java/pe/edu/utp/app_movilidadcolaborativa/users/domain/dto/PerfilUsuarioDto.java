package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.DireccionResidencia;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Estadisticas;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.SedeUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;

import java.time.Instant;
import java.util.List;

/** Perfil completo del usuario. Nunca incluye contrasena_hash ni saldo_creditos. */
public record PerfilUsuarioDto(
		String id,
		String email,
		String firstName,
		String lastName,
		String phone,
		String documentType,
		String documentNumber,
		String photoUrl,
		Referencia department,
		Referencia district,
		SedeDto campus,
		Lugar homeAddress,
		List<String> roles,
		String activeMode,
		String status,
		VehiculoDto vehicle,
		EstadisticasDto stats,
		CalificacionDto rating,
		Instant createdAt) {

	public record Referencia(String id, String name) {

		static Referencia desde(ReferenciaNombre referencia) {
			return referencia == null ? null : new Referencia(referencia.id().toHexString(), referencia.nombre());
		}
	}

	public record SedeDto(String id, String name, String address) {

		static SedeDto desde(SedeUsuario sede) {
			return sede == null ? null : new SedeDto(sede.id().toHexString(), sede.nombre(), sede.direccion());
		}
	}

	public record Lugar(String label, String address, Punto location) {

		// En el Point GeoJSON x es la longitud e y la latitud.
		static Lugar desde(DireccionResidencia direccion) {
			if (direccion == null) {
				return null;
			}
			Punto punto = direccion.ubicacion() == null ? null
					: new Punto(direccion.ubicacion().getY(), direccion.ubicacion().getX());
			return new Lugar(direccion.etiqueta(), direccion.direccion(), punto);
		}
	}

	public record Punto(double lat, double lng) {
	}

	public record EstadisticasDto(int trips, int compliance, double co2SavedKg) {

		// Las estadísticas empiezan en cero: un usuario nuevo todavía no tiene el campo.
		static EstadisticasDto desde(Estadisticas estadisticas) {
			if (estadisticas == null) {
				return new EstadisticasDto(0, 0, 0);
			}
			return new EstadisticasDto(
					estadisticas.viajes() == null ? 0 : estadisticas.viajes(),
					estadisticas.cumplimiento() == null ? 0 : estadisticas.cumplimiento(),
					estadisticas.ahorroCo2Kg() == null ? 0 : estadisticas.ahorroCo2Kg());
		}
	}

	public record CalificacionDto(double average, int count) {

		public static CalificacionDto desde(Calificacion calificacion) {
			if (calificacion == null || calificacion.promedio() == null || calificacion.cantidad() == null) {
				return null;
			}
			return new CalificacionDto(calificacion.promedio(), calificacion.cantidad());
		}
	}

	public static PerfilUsuarioDto desde(Usuario usuario) {
		List<Rol> roles = usuario.getRoles() == null ? List.of() : usuario.getRoles();
		return new PerfilUsuarioDto(
				usuario.getId().toHexString(),
				usuario.getCorreo(),
				usuario.getNombres(),
				usuario.getApellidos(),
				usuario.getTelefono(),
				usuario.getTipoDocumento() == null ? null : usuario.getTipoDocumento().name(),
				usuario.getNumeroDocumento(),
				usuario.getFoto() == null ? null : usuario.getFoto().url(),
				Referencia.desde(usuario.getDepartamento()),
				Referencia.desde(usuario.getDistrito()),
				SedeDto.desde(usuario.getSede()),
				Lugar.desde(usuario.getDireccionResidencia()),
				roles.stream().map(Rol::getApi).toList(),
				usuario.getModoActivo() == null ? null : usuario.getModoActivo().getApi(),
				usuario.getEstado().getApi(),
				usuario.getVehiculo() == null ? null : VehiculoDto.desde(usuario.getVehiculo()),
				EstadisticasDto.desde(usuario.getEstadisticas()),
				CalificacionDto.desde(usuario.getCalificacion()),
				usuario.getFechaCreacion());
	}
}
