package pe.edu.utp.app_movilidadcolaborativa.vehicles.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.Archivo;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.PropositoArchivo;
import pe.edu.utp.app_movilidadcolaborativa.files.infrastructure.persistence.ArchivoRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.AccesibilidadDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.VehiculoDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Accesibilidad;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Soat;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoDocumento;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.ActualizarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.RegistrarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.SoatRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.validation.ReglasVehiculo;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

/**
 * Registro, consulta y actualización del vehículo del conductor, embebido en su usuario (RF-02, RF-14), con su
 * accesibilidad (RN-18) y su SOAT (RN-36).
 */
@Service
@RequiredArgsConstructor
public class VehiculoService {

	private static final String COLECCION_VIAJES = "viajes";
	private static final List<String> ESTADOS_VIAJE_ACTIVO = List.of("PUBLICADO", "EN_CURSO");

	private final UsuarioRepository usuarioRepository;
	private final ArchivoRepository archivoRepository;
	private final MongoTemplate mongoTemplate;

	/** Guarda el vehículo dentro del usuario y le agrega el rol CONDUCTOR. */
	public VehiculoDto registrar(ObjectId usuarioId, RegistrarVehiculoRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		if (usuario.getVehiculo() != null) {
			throw vehiculoYaRegistrado();
		}
		return guardarNuevo(usuario, solicitud);
	}

	private VehiculoDto guardarNuevo(Usuario usuario, RegistrarVehiculoRequest solicitud) {
		ObjectId usuarioId = usuario.getId();
		if (usuario.getEstado() == EstadoUsuario.PERFIL_PENDIENTE) {
			throw new ApiException(CodigoError.PROFILE_INCOMPLETE, "Completa tu perfil antes de registrar tu vehículo");
		}
		TipoVehiculo tipo = TipoVehiculo.desdeApi(solicitud.type());
		Accesibilidad accesibilidad = accesibilidad(tipo, solicitud.accessibility(), null);
		validarPlacaLibre(solicitud.plate(), usuarioId);

		// En milisegundos, la precisión de MongoDB: la respuesta coincide con lo que se lee después.
		Instant ahora = Instant.now().truncatedTo(ChronoUnit.MILLIS);
		Soat soat = soat(solicitud.soat(), null, usuarioId, ahora);
		Vehiculo vehiculo = new Vehiculo(
				solicitud.plate(),
				tipo,
				solicitud.brand(),
				solicitud.model(),
				solicitud.color(),
				solicitud.year(),
				solicitud.seats(),
				solicitud.ownerDni(),
				Boolean.TRUE.equals(solicitud.isOwner()),
				EstadoVehiculo.ACTIVO,
				solicitud.photoFileId() == null ? null : buscarFoto(solicitud.photoFileId(), usuarioId),
				ahora,
				ahora,
				accesibilidad,
				soat);
		Update cambios = new Update()
				.set("vehiculo", vehiculo)
				.addToSet("roles", Rol.CONDUCTOR)
				.set("fecha_actualizacion", ahora);
		// El filtro por vehículo inexistente evita que dos registros simultáneos se pisen.
		Query sinVehiculo = Query.query(Criteria.where("_id").is(usuarioId).and("vehiculo").exists(false));
		if (actualizarUsuario(sinVehiculo, cambios) == 0) {
			throw vehiculoYaRegistrado();
		}
		return VehiculoDto.desde(vehiculo);
	}

	public VehiculoDto consultar(ObjectId usuarioId) {
		Usuario usuario = buscarUsuario(usuarioId);
		if (usuario.getVehiculo() == null) {
			throw new ApiException(CodigoError.VEHICLE_NOT_FOUND, "No tienes un vehículo registrado");
		}
		return VehiculoDto.desde(usuario.getVehiculo());
	}

	/**
	 * Reemplaza los datos editables del vehículo y actualiza su copia en los viajes activos del conductor.
	 * Si no llegan una foto nueva, la accesibilidad o el SOAT, se conservan los actuales. Si el usuario todavía no tiene vehículo, lo registra:
	 * no hay viajes que actualizar.
	 */
	public VehiculoDto actualizar(ObjectId usuarioId, ActualizarVehiculoRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		Vehiculo anterior = usuario.getVehiculo();
		if (anterior == null) {
			return guardarNuevo(usuario, new RegistrarVehiculoRequest(solicitud.plate(), solicitud.type(),
					solicitud.brand(), solicitud.model(), solicitud.color(), solicitud.year(), solicitud.seats(),
					dniPropietario(usuario, solicitud), solicitud.isOwner(), solicitud.acceptedTerms(),
					solicitud.photoFileId(), solicitud.accessibility(), solicitud.soat()));
		}
		TipoVehiculo tipo = TipoVehiculo.desdeApi(solicitud.type());
		Accesibilidad accesibilidad = accesibilidad(tipo, solicitud.accessibility(), anterior.accesibilidad());
		validarPlacaLibre(solicitud.plate(), usuarioId);

		// En milisegundos, la precisión de MongoDB: la respuesta coincide con lo que se lee después.
		Instant ahora = Instant.now().truncatedTo(ChronoUnit.MILLIS);
		Soat soat = soat(solicitud.soat(), anterior.soat(), usuarioId, ahora);
		Vehiculo vehiculo = new Vehiculo(
				solicitud.plate(),
				tipo,
				solicitud.brand(),
				solicitud.model(),
				solicitud.color(),
				solicitud.year(),
				solicitud.seats(),
				anterior.dniPropietario(),
				solicitud.isOwner() == null ? anterior.esPropietario() : solicitud.isOwner(),
				anterior.estado(),
				solicitud.photoFileId() == null ? anterior.foto() : buscarFoto(solicitud.photoFileId(), usuarioId),
				ahora,
				anterior.fechaRegistro(),
				accesibilidad,
				soat);
		Update cambios = new Update()
				.set("vehiculo", vehiculo)
				.set("fecha_actualizacion", ahora);
		actualizarUsuario(Query.query(Criteria.where("_id").is(usuarioId)), cambios);
		actualizarCopiaEnViajes(usuarioId, anterior, vehiculo);
		return VehiculoDto.desde(vehiculo);
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}

	// «Actualizar vehículo» no pide el DNI del propietario: si no llega, se usa el DNI del usuario, si lo registró.
	private static String dniPropietario(Usuario usuario, ActualizarVehiculoRequest solicitud) {
		if (solicitud.ownerDni() != null) {
			return solicitud.ownerDni();
		}
		return usuario.getTipoDocumento() == TipoDocumento.DNI ? usuario.getNumeroDocumento() : null;
	}

	/**
	 * RN-18: si no llega, se conserva la anterior (o ninguna). Una MOTO no puede marcar ningún check; si el
	 * vehículo pasa a ser una MOTO sin enviar la accesibilidad, se le quitan los que tenía.
	 */
	private static Accesibilidad accesibilidad(TipoVehiculo tipo, AccesibilidadDto solicitud, Accesibilidad anterior) {
		if (solicitud == null) {
			return tipo == TipoVehiculo.MOTO || anterior == null ? Accesibilidad.NINGUNA : anterior;
		}
		Accesibilidad accesibilidad = solicitud.aAccesibilidad();
		if (tipo == TipoVehiculo.MOTO && accesibilidad.tieneAlguna()) {
			throw new ValidacionException("accessibility", "Una moto no puede marcarse como accesible");
		}
		return accesibilidad;
	}

	/**
	 * RN-36: el SOAT está vigente hoy y dura como máximo 366 días. Si no llega, se conserva el anterior (puede no
	 * haber ninguno). Sin foto nueva, se conserva la del SOAT anterior.
	 */
	private Soat soat(SoatRequest solicitud, Soat anterior, ObjectId usuarioId, Instant ahora) {
		if (solicitud == null) {
			return anterior;
		}
		LocalDate inicio = solicitud.startDate();
		LocalDate fin = solicitud.endDate();
		if (fin.isBefore(inicio)) {
			throw new ValidacionException("soat.endDate", "La fecha de fin debe ser posterior a la de inicio");
		}
		if (ChronoUnit.DAYS.between(inicio, fin) + 1 > ReglasVehiculo.MAXIMO_DIAS_SOAT) {
			throw new ValidacionException("soat.endDate", "La vigencia del SOAT no puede superar los 366 días");
		}
		LocalDate hoy = Soat.fechaPeru(ahora);
		if (hoy.isBefore(inicio) || hoy.isAfter(fin)) {
			throw new ApiException(CodigoError.SOAT_NOT_VALID,
					"Tu SOAT no está vigente. No puedes registrar el vehículo sin un SOAT vigente.");
		}
		Foto foto = solicitud.photoFileId() != null
				? buscarArchivo(solicitud.photoFileId(), usuarioId, PropositoArchivo.FOTO_SOAT,
						"La foto del SOAT no existe o no te pertenece")
				: anterior == null ? null : anterior.foto();
		return new Soat(solicitud.insurer(), solicitud.policyNumber(), Soat.inicioDelDia(inicio),
				Soat.inicioDelDia(fin), foto, ahora);
	}

	private void validarPlacaLibre(String placa, ObjectId usuarioId) {
		if (usuarioRepository.existsByVehiculoPlacaAndIdNot(placa, usuarioId)) {
			throw placaEnUso();
		}
	}

	private Foto buscarFoto(String archivoId, ObjectId usuarioId) {
		return buscarArchivo(archivoId, usuarioId, PropositoArchivo.FOTO_VEHICULO,
				"La foto del vehículo no existe o no te pertenece");
	}

	private Foto buscarArchivo(String archivoId, ObjectId usuarioId, PropositoArchivo proposito, String mensaje) {
		Archivo archivo = archivoRepository.findById(new ObjectId(archivoId))
				.filter(encontrado -> usuarioId.equals(encontrado.propietarioId())
						&& encontrado.proposito() == proposito)
				.orElseThrow(() -> new ApiException(CodigoError.INVALID_FILE_REFERENCE, mensaje));
		return new Foto(archivo.id(), archivo.url());
	}

	// Actualización parcial: no reemplaza el documento (ver Usuario).
	private long actualizarUsuario(Query filtro, Update cambios) {
		try {
			return mongoTemplate.updateFirst(filtro, cambios, Usuario.class).getModifiedCount();
		} catch (DuplicateKeyException ex) {
			// Dos usuarios guardan la misma placa a la vez: el índice único rechaza al segundo.
			throw placaEnUso();
		}
	}

	// Los viajes copian marca, modelo, color, placa, accesibilidad y fin del SOAT; solo se actualizan los activos.
	private void actualizarCopiaEnViajes(ObjectId usuarioId, Vehiculo anterior, Vehiculo actual) {
		boolean igual = actual.marca().equals(anterior.marca()) && actual.modelo().equals(anterior.modelo())
				&& actual.color().equals(anterior.color()) && actual.placa().equals(anterior.placa())
				&& actual.esApto() == anterior.esApto()
				&& Objects.equals(soatFechaFin(actual), soatFechaFin(anterior));
		if (igual) {
			return;
		}
		Update copia = new Update()
				.set("vehiculo.marca", actual.marca())
				.set("vehiculo.modelo", actual.modelo())
				.set("vehiculo.color", actual.color())
				.set("vehiculo.placa", actual.placa())
				.set("vehiculo.apto_movilidad_reducida", actual.esApto())
				.set("vehiculo.soat_fecha_fin", soatFechaFin(actual));
		mongoTemplate.updateMulti(
				Query.query(Criteria.where("conductor.id").is(usuarioId).and("estado").in(ESTADOS_VIAJE_ACTIVO)),
				copia, COLECCION_VIAJES);
	}

	private static Instant soatFechaFin(Vehiculo vehiculo) {
		return vehiculo.soat() == null ? null : vehiculo.soat().fechaFin();
	}

	private static ApiException placaEnUso() {
		return new ApiException(CodigoError.PLATE_ALREADY_REGISTERED, "La placa ya está registrada");
	}

	private static ApiException vehiculoYaRegistrado() {
		return new ApiException(CodigoError.VEHICLE_ALREADY_REGISTERED, "Ya tienes un vehículo registrado");
	}
}
