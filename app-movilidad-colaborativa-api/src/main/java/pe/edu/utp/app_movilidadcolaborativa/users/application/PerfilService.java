package pe.edu.utp.app_movilidadcolaborativa.users.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.Archivo;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.PropositoArchivo;
import pe.edu.utp.app_movilidadcolaborativa.files.infrastructure.persistence.ArchivoRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.ActualizarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoDocumento;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** Consulta y actualización del perfil del usuario autenticado (RF-19 a RF-21, RN-14). */
@Service
@RequiredArgsConstructor
public class PerfilService {

	private static final String COLECCION_VIAJES = "viajes";
	private static final List<String> ESTADOS_VIAJE_ACTIVO = List.of("PUBLICADO", "EN_CURSO");

	private final UsuarioRepository usuarioRepository;
	private final ArchivoRepository archivoRepository;
	private final MongoTemplate mongoTemplate;

	/** El perfil sale de un solo documento, que ya incluye la sede, las estadísticas y el vehículo. */
	public PerfilUsuarioDto consultar(ObjectId usuarioId) {
		return PerfilUsuarioDto.desde(buscarUsuario(usuarioId));
	}

	/**
	 * Actualiza nombres, apellidos, teléfono, modalidad y, si llega, la foto. El documento de identidad
	 * solo se guarda mientras el usuario no tenga uno; después se ignora.
	 */
	public PerfilUsuarioDto actualizar(ObjectId usuarioId, ActualizarPerfilRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		if (usuario.getEstado() == EstadoUsuario.PERFIL_PENDIENTE) {
			throw new ApiException(CodigoError.PROFILE_INCOMPLETE, "Completa tu perfil antes de actualizar tus datos");
		}

		Update cambios = new Update()
				.set("nombres", solicitud.firstName())
				.set("apellidos", solicitud.lastName())
				.set("telefono", solicitud.phone())
				.set("fecha_actualizacion", Instant.now());
		if (usuario.getNumeroDocumento() == null) {
			cambios.set("tipo_documento", validarDocumento(solicitud))
					.set("numero_documento", solicitud.documentNumber());
		}

		Rol modoActivo = Rol.desdeApi(solicitud.activeMode());
		if (modoActivo == Rol.CONDUCTOR && usuario.getVehiculo() == null) {
			throw new ApiException(CodigoError.VEHICLE_REQUIRED,
					"Registra un vehículo para usar la modalidad de conductor");
		}
		cambios.set("modo_activo", modoActivo);

		Foto foto = usuario.getFoto();
		if (solicitud.photoFileId() != null) {
			Archivo archivo = archivoRepository.findById(new ObjectId(solicitud.photoFileId()))
					.filter(encontrado -> usuarioId.equals(encontrado.propietarioId())
							&& encontrado.proposito() == PropositoArchivo.FOTO_PERFIL)
					.orElseThrow(() -> new ApiException(CodigoError.INVALID_FILE_REFERENCE,
							"La foto de perfil no existe o no te pertenece"));
			foto = new Foto(archivo.id(), archivo.url());
			cambios.set("foto", foto);
		}

		// Actualización parcial: no reemplaza el documento (ver Usuario).
		mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(usuarioId)), cambios, Usuario.class);
		actualizarCopiaEnViajes(usuario, solicitud, foto);
		return consultar(usuarioId);
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}

	/** RN-14: el tipo y el número de documento son obligatorios la primera vez. */
	private static TipoDocumento validarDocumento(ActualizarPerfilRequest solicitud) {
		TipoDocumento tipo = TipoDocumento.desde(solicitud.documentType());
		String numero = solicitud.documentNumber();
		List<ErrorCampo> errores = new ArrayList<>();
		if (numero == null || numero.isEmpty()) {
			errores.add(new ErrorCampo("documentNumber", "El número de documento es obligatorio"));
		} else if (tipo != null && !ReglasUsuario.esNumeroDocumentoValido(tipo, numero)) {
			errores.add(new ErrorCampo("documentNumber", tipo == TipoDocumento.DNI
					? "El DNI debe tener 8 dígitos"
					: "El carné de extranjería debe tener entre 8 y 12 letras o números"));
		}
		if (solicitud.documentType() == null || solicitud.documentType().isEmpty()) {
			errores.add(new ErrorCampo("documentType", "El tipo de documento es obligatorio"));
		} else if (tipo == null) {
			errores.add(new ErrorCampo("documentType", "El tipo de documento no es válido"));
		}
		if (!errores.isEmpty()) {
			throw new ValidacionException(errores);
		}
		return tipo;
	}

	// Los viajes copian el nombre y la foto del conductor; solo se actualizan los viajes activos.
	private void actualizarCopiaEnViajes(Usuario anterior, ActualizarPerfilRequest solicitud, Foto foto) {
		if (anterior.getVehiculo() == null) {
			return;
		}
		String nombre = ReglasUsuario.nombrePublico(solicitud.firstName(), solicitud.lastName());
		Update copia = new Update();
		if (!nombre.equals(ReglasUsuario.nombrePublico(anterior.getNombres(), anterior.getApellidos()))) {
			copia.set("conductor.nombre", nombre);
		}
		if (!Objects.equals(foto, anterior.getFoto())) {
			copia.set("conductor.foto_url", foto.url());
		}
		if (copia.getUpdateObject().isEmpty()) {
			return;
		}
		mongoTemplate.updateMulti(
				Query.query(Criteria.where("conductor.id").is(anterior.getId()).and("estado").in(ESTADOS_VIAJE_ACTIVO)),
				copia, COLECCION_VIAJES);
	}
}
