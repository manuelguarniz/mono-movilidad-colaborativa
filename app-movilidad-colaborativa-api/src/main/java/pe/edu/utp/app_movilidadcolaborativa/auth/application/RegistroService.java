package pe.edu.utp.app_movilidadcolaborativa.auth.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.CompletarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.RegistroRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.TokenUsuarioResponse;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.AlcanceToken;
import pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.security.JwtService;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Departamento;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Distrito;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Sede;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.DepartamentoRepository;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.DistritoRepository;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.SedeRepository;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.Archivo;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.PropositoArchivo;
import pe.edu.utp.app_movilidadcolaborativa.files.infrastructure.persistence.ArchivoRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.UsuarioSesionDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.SedeUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.util.List;

/** Creación de la cuenta y datos del perfil (RF-05, RF-06). */
@Service
@RequiredArgsConstructor
public class RegistroService {

	private final UsuarioRepository usuarioRepository;
	private final DepartamentoRepository departamentoRepository;
	private final DistritoRepository distritoRepository;
	private final SedeRepository sedeRepository;
	private final ArchivoRepository archivoRepository;
	private final MongoTemplate mongoTemplate;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	/** Crea el usuario en PERFIL_PENDIENTE y devuelve un token REGISTRATION. */
	public TokenUsuarioResponse registrar(RegistroRequest solicitud) {
		String correo = solicitud.email();
		if (usuarioRepository.existsByCorreo(correo)) {
			throw correoEnUso();
		}
		Instant ahora = Instant.now();
		Usuario usuario = Usuario.builder()
				.correo(correo)
				.contrasenaHash(passwordEncoder.encode(solicitud.password()))
				.roles(List.of())
				.estado(EstadoUsuario.PERFIL_PENDIENTE)
				.fechaAceptacionTerminos(ahora)
				.fechaCreacion(ahora)
				.fechaActualizacion(ahora)
				.build();
		try {
			usuario = usuarioRepository.insert(usuario);
		} catch (DuplicateKeyException ex) {
			// Dos registros simultáneos con el mismo correo: el índice único rechaza el segundo.
			throw correoEnUso();
		}
		return TokenUsuarioResponse.de(jwtService.emitir(usuario.getId(), AlcanceToken.REGISTRATION),
				UsuarioSesionDto.desde(usuario));
	}

	/** Guarda los datos personales, copia departamento, distrito y sede, y activa la cuenta como pasajero. */
	public void completarPerfil(ObjectId usuarioId, CompletarPerfilRequest solicitud) {
		Usuario usuario = usuarioRepository.findById(usuarioId)
				.filter(encontrado -> encontrado.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));

		Departamento departamento = departamentoRepository.findById(new ObjectId(solicitud.departmentId()))
				.orElseThrow(() -> catalogoInvalido("El departamento no existe"));
		Distrito distrito = distritoRepository.findById(new ObjectId(solicitud.districtId()))
				.filter(encontrado -> encontrado.departamento().id().equals(departamento.id()))
				.orElseThrow(() -> catalogoInvalido("El distrito no pertenece al departamento"));
		Sede sede = sedeRepository.findById(new ObjectId(solicitud.campusId()))
				.filter(encontrada -> encontrada.activa() && encontrada.distrito().id().equals(distrito.id()))
				.orElseThrow(() -> catalogoInvalido("La sede no pertenece al distrito"));

		Update cambios = new Update()
				.set("nombres", solicitud.firstName())
				.set("apellidos", solicitud.lastName())
				.set("departamento", new ReferenciaNombre(departamento.id(), departamento.nombre()))
				.set("distrito", new ReferenciaNombre(distrito.id(), distrito.nombre()))
				.set("sede", new SedeUsuario(sede.id(), sede.nombre(), sede.direccion()))
				.addToSet("roles", Rol.PASAJERO)
				.set("estado", EstadoUsuario.ACTIVO)
				.set("fecha_actualizacion", Instant.now());
		// Un conductor que repite este paso con un token SESSION conserva su modalidad activa.
		if (usuario.getModoActivo() == null) {
			cambios.set("modo_activo", Rol.PASAJERO);
		}
		if (solicitud.photoFileId() != null) {
			Archivo archivo = archivoRepository.findById(new ObjectId(solicitud.photoFileId()))
					.filter(encontrado -> usuarioId.equals(encontrado.propietarioId())
							&& encontrado.proposito() == PropositoArchivo.FOTO_PERFIL)
					.orElseThrow(() -> new ApiException(CodigoError.INVALID_FILE_REFERENCE,
							"La foto de perfil no existe o no te pertenece"));
			cambios.set("foto", new Foto(archivo.id(), archivo.url()));
		}
		// Actualización parcial: no reemplaza el documento (ver Usuario).
		mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(usuarioId)), cambios, Usuario.class);
	}

	private static ApiException correoEnUso() {
		return new ApiException(CodigoError.EMAIL_ALREADY_REGISTERED, "El correo ya está en uso");
	}

	private static ApiException catalogoInvalido(String mensaje) {
		return new ApiException(CodigoError.INVALID_CATALOG_REFERENCE, mensaje);
	}
}
