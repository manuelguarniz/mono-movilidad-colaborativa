package pe.edu.utp.app_movilidadcolaborativa.auth.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.CompletarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.RegistroRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.TokenUsuarioResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.model.AlcanceToken;
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
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation.Validacion;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.UsuarioSesionDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.SedeUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;
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
		String correo = ReglasUsuario.normalizarCorreo(solicitud.email());
		new Validacion()
				.exigir(correo != null && !correo.isEmpty(), "email", "El correo es obligatorio")
				.exigir(ReglasUsuario.esCorreoUtp(correo), "email", "El correo debe ser del dominio utp.edu.pe")
				.exigir(ReglasUsuario.esContrasenaValida(solicitud.password()), "password",
						"La contraseña debe tener entre 8 y 72 caracteres con letras, números y símbolos")
				.exigir(Boolean.TRUE.equals(solicitud.acceptedTerms()), "acceptedTerms",
						"Debes aceptar los términos y condiciones")
				.lanzarSiHayErrores("Revisa los datos de registro");

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
		String nombres = solicitud.firstName() == null ? null : solicitud.firstName().trim();
		String apellidos = solicitud.lastName() == null ? null : solicitud.lastName().trim();
		// Mientras no exista POST /files la foto es opcional; si llega, se valida.
		new Validacion()
				.exigir(nombres != null && !nombres.isEmpty(), "firstName", "Los nombres son obligatorios")
				.exigir(ReglasUsuario.esNombreValido(nombres), "firstName",
						"Los nombres deben tener al menos una letra y como máximo 60 caracteres")
				.exigir(apellidos != null && !apellidos.isEmpty(), "lastName", "Los apellidos son obligatorios")
				.exigir(ReglasUsuario.esNombreValido(apellidos), "lastName",
						"Los apellidos deben tener al menos una letra y como máximo 60 caracteres")
				.exigir(solicitud.departmentId() != null, "departmentId", "El departamento es obligatorio")
				.exigir(Validacion.esObjectId(solicitud.departmentId()), "departmentId", "El departamento no es válido")
				.exigir(solicitud.districtId() != null, "districtId", "El distrito es obligatorio")
				.exigir(Validacion.esObjectId(solicitud.districtId()), "districtId", "El distrito no es válido")
				.exigir(solicitud.campusId() != null, "campusId", "La sede es obligatoria")
				.exigir(Validacion.esObjectId(solicitud.campusId()), "campusId", "La sede no es válida")
				.exigir(solicitud.photoFileId() == null || Validacion.esObjectId(solicitud.photoFileId()),
						"photoFileId", "La foto de perfil no es válida")
				.lanzarSiHayErrores("Faltan datos obligatorios del perfil");

		Usuario usuario = usuarioRepository.findById(usuarioId)
				.filter(encontrado -> encontrado.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED",
						"Tu sesión expiró. Vuelve a iniciar sesión."));

		Departamento departamento = departamentoRepository.findById(new ObjectId(solicitud.departmentId()))
				.orElseThrow(() -> catalogoInvalido("El departamento no existe"));
		Distrito distrito = distritoRepository.findById(new ObjectId(solicitud.districtId()))
				.filter(encontrado -> encontrado.departamento().id().equals(departamento.id()))
				.orElseThrow(() -> catalogoInvalido("El distrito no pertenece al departamento"));
		Sede sede = sedeRepository.findById(new ObjectId(solicitud.campusId()))
				.filter(encontrada -> encontrada.activa() && encontrada.distrito().id().equals(distrito.id()))
				.orElseThrow(() -> catalogoInvalido("La sede no pertenece al distrito"));

		Update cambios = new Update()
				.set("nombres", nombres)
				.set("apellidos", apellidos)
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
					.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_FILE_REFERENCE",
							"La foto de perfil no existe o no te pertenece"));
			cambios.set("foto", new Foto(archivo.id(), archivo.url()));
		}
		// Actualización parcial: no reemplaza el documento (ver Usuario).
		mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(usuarioId)), cambios, Usuario.class);
	}

	private static ApiException correoEnUso() {
		return new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "El correo ya está en uso");
	}

	private static ApiException catalogoInvalido(String mensaje) {
		return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CATALOG_REFERENCE", mensaje);
	}
}
