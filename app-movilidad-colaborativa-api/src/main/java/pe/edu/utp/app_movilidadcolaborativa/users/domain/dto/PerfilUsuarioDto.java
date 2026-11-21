package pe.edu.utp.app_movilidadcolaborativa.users.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.AsistenciaMovilidad;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.DireccionResidencia;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Estadisticas;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.SedeUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;

import java.time.Instant;
import java.util.List;

/**
 * Perfil completo del usuario. Nunca incluye contrasena_hash ni saldo_creditos (el saldo sale de GET /wallet).
 * cancellationBlock solo existe si el conductor superó el límite de cancelaciones (RN-30): «Publicar viaje» se
 * bloquea desde la entrada. tripInProgress solo existe si el usuario tiene un viaje EN_CURSO, como conductor o como
 * pasajero con su reserva EN_VIAJE: mientras tanto no puede cambiar de modo (RN-48). mobilityAssistance solo viaja
 * en el perfil propio (RN-22) y nunca lleva la fecha de consentimiento.
 */
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
		AsistenciaDto mobilityAssistance,
		List<String> roles,
		String activeMode,
		String status,
		VehiculoDto vehicle,
		EstadisticasDto stats,
		CalificacionDto rating,
		Instant createdAt,
		BloqueoCancelacionesDto cancellationBlock,
		ViajeEnCursoDto tripInProgress) {

	/**
	 * role: DRIVER si conduce el viaje, PASSENGER si viaja en él; startedAt es la hora real de inicio. driver y
	 * vehicle son las copias del viaje, para que el pasajero vea con quién viaja (13-E).
	 */
	public record ViajeEnCursoDto(String rideId, String role, String origin, String destination, Instant startedAt,
			ConductorDto driver, VehiculoResumenDto vehicle) {
	}

	public record ConductorDto(String name, String photoUrl) {
	}

	public record VehiculoResumenDto(String brand, String model, String color) {
	}

	/** type: WHEELCHAIR, CRUTCHES_OR_WALKER u OTHER (RN-17). */
	public record AsistenciaDto(String type, String note) {

		static AsistenciaDto desde(AsistenciaMovilidad asistencia) {
			return asistencia == null || asistencia.tipo() == null ? null
					: new AsistenciaDto(asistencia.tipo().getApi(), asistencia.nota());
		}
	}

	/** count: viajes cancelados en la ventana; until: desde cuándo podrá publicar de nuevo. */
	public record BloqueoCancelacionesDto(int count, Instant until) {
	}

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
		return desde(usuario, null, null);
	}

	public static PerfilUsuarioDto desde(Usuario usuario, BloqueoCancelacionesDto bloqueo,
			ViajeEnCursoDto viajeEnCurso) {
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
				AsistenciaDto.desde(usuario.getAsistenciaMovilidad()),
				roles.stream().map(Rol::getApi).toList(),
				usuario.getModoActivo() == null ? null : usuario.getModoActivo().getApi(),
				usuario.getEstado().getApi(),
				usuario.getVehiculo() == null ? null : VehiculoDto.desde(usuario.getVehiculo()),
				EstadisticasDto.desde(usuario.getEstadisticas()),
				CalificacionDto.desde(usuario.getCalificacion()),
				usuario.getFechaCreacion(),
				bloqueo,
				viajeEnCurso);
	}
}
