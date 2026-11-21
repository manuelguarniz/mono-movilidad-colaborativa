package pe.edu.utp.app_movilidadcolaborativa.ratings.application;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.CalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.CalificarRequest;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.ContextoCalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.ContextoCalificacionDto.PersonaDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.ContextoCalificacionDto.VehiculoDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.dto.ContextoCalificacionDto.ViajeDto;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.model.CalificacionViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.LugarResumen;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Sede;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ReservaRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Calificaciones (RF-10, RN-47). El pasajero con reserva COMPLETADA califica al conductor y el conductor a cada
 * pasajero COMPLETADA, una vez por reserva, durante dias_para_calificar (1 = 24 h) desde fecha_fin. Insertar la
 * calificación y recalcular el promedio del calificado van en una transacción; después se copia el promedio en sus
 * viajes activos.
 */
@Service
@RequiredArgsConstructor
public class CalificacionService {

	public static final String NO_PARTICIPANTE = "Solo pueden calificar quienes hicieron el viaje";
	public static final String PLAZO_VENCIDO = "El plazo para calificar este viaje terminó";
	public static final String REPETIDA = "Ya calificaste a esta persona en este viaje";
	private static final int INTENTOS = 3;
	private static final String COLECCION = "calificaciones";

	private final UsuarioRepository usuarioRepository;
	private final ViajeRepository viajeRepository;
	private final ReservaRepository reservaRepository;
	private final MongoTemplate mongoTemplate;
	private final PlatformTransactionManager transactionManager;
	private final ParametrosService parametrosService;

	/** Hasta cuándo se puede calificar el viaje: fecha_fin + dias_para_calificar; null si no terminó. */
	public static Instant plazo(Viaje viaje, int dias) {
		return viaje.fechaFin() == null ? null : viaje.fechaFin().plus(Duration.ofDays(dias));
	}

	// ------------------------------------------------------------------ Consulta

	/** P20: el viaje, el plazo y las personas que el usuario califica, con las que ya calificó marcadas. */
	public ContextoCalificacionDto contexto(ObjectId usuarioId, ObjectId viajeId) {
		buscarUsuario(usuarioId);
		Viaje viaje = viajeRepository.findById(viajeId)
				.orElseThrow(() -> new ApiException(CodigoError.RIDE_NOT_FOUND, "Viaje no encontrado"));
		if (viaje.estado() != EstadoViaje.COMPLETADO) {
			throw new ApiException(CodigoError.RATING_NOT_ALLOWED, NO_PARTICIPANTE);
		}
		boolean esConductor = usuarioId.equals(viaje.conductor().id());
		List<Reserva> completadas = mongoTemplate.find(Query.query(Criteria.where("viaje_id").is(viajeId)
						.and("estado").is(EstadoReserva.COMPLETADA))
				.with(Sort.by(Sort.Direction.ASC, "fecha_creacion")), Reserva.class);
		Set<ObjectId> calificadas = mongoTemplate.find(Query.query(Criteria.where("viaje_id").is(viajeId)
						.and("autor.id").is(usuarioId)), CalificacionViaje.class).stream()
				.map(CalificacionViaje::reservaId).collect(Collectors.toSet());

		List<PersonaDto> personas;
		if (esConductor) {
			Map<ObjectId, Usuario> pasajeros = new HashMap<>();
			usuarioRepository.findAllById(completadas.stream().map(reserva -> reserva.pasajero().id()).toList())
					.forEach(usuario -> pasajeros.put(usuario.getId(), usuario));
			personas = completadas.stream().map(reserva -> {
				Usuario pasajero = pasajeros.get(reserva.pasajero().id());
				return new PersonaDto(reserva.id().toHexString(), reserva.pasajero().id().toHexString(),
						reserva.pasajero().nombre(),
						pasajero == null || pasajero.getFoto() == null ? null : pasajero.getFoto().url(),
						Rol.PASAJERO.getApi(), reserva.plazas(), null, calificadas.contains(reserva.id()));
			}).toList();
		} else {
			Reserva propia = completadas.stream().filter(reserva -> usuarioId.equals(reserva.pasajero().id()))
					.findFirst()
					.orElseThrow(() -> new ApiException(CodigoError.RATING_NOT_ALLOWED, NO_PARTICIPANTE));
			var vehiculo = viaje.vehiculo();
			personas = List.of(new PersonaDto(propia.id().toHexString(), viaje.conductor().id().toHexString(),
					viaje.conductor().nombre(), viaje.conductor().fotoUrl(), Rol.CONDUCTOR.getApi(), null,
					vehiculo == null ? null
							: new VehiculoDto(vehiculo.marca(), vehiculo.modelo(), vehiculo.color(), vehiculo.placa()),
					calificadas.contains(propia.id())));
		}

		Instant hasta = plazo(viaje, parametrosService.leer().diasParaCalificar());
		return new ContextoCalificacionDto(
				new ViajeDto(viaje.id().toHexString(), viaje.fechaSalida(), viaje.fechaFin(), Sede.desde(viaje.sede()),
						LugarResumen.desde(viaje.origen()), LugarResumen.desde(viaje.destino())),
				(esConductor ? Rol.CONDUCTOR : Rol.PASAJERO).getApi(),
				hasta,
				hasta != null && Instant.now().isBefore(hasta),
				personas);
	}

	// ------------------------------------------------------------------ Registro

	/** RN-47: registra la calificación y recalcula el promedio del calificado. */
	public CalificacionDto calificar(ObjectId usuarioId, CalificarRequest solicitud) {
		Usuario autor = buscarUsuario(usuarioId);
		Reserva reserva = reservaRepository.findById(new ObjectId(solicitud.bookingId()))
				.orElseThrow(() -> new ApiException(CodigoError.RATING_NOT_ALLOWED, NO_PARTICIPANTE));
		Viaje viaje = viajeRepository.findById(reserva.viajeId())
				.orElseThrow(() -> new ApiException(CodigoError.RATING_NOT_ALLOWED, NO_PARTICIPANTE));
		boolean autorPasajero = usuarioId.equals(reserva.pasajero().id());
		boolean autorConductor = usuarioId.equals(viaje.conductor().id());
		if ((!autorPasajero && !autorConductor) || reserva.estado() != EstadoReserva.COMPLETADA
				|| viaje.estado() != EstadoViaje.COMPLETADO) {
			throw new ApiException(CodigoError.RATING_NOT_ALLOWED, NO_PARTICIPANTE);
		}
		Instant ahora = Instant.now();
		Instant hasta = plazo(viaje, parametrosService.leer().diasParaCalificar());
		if (hasta == null || !ahora.isBefore(hasta)) {
			throw new ApiException(CodigoError.RATING_WINDOW_CLOSED, PLAZO_VENCIDO);
		}
		ObjectId calificadoId = autorPasajero ? viaje.conductor().id() : reserva.pasajero().id();
		if (mongoTemplate.exists(Query.query(Criteria.where("reserva_id").is(reserva.id())
				.and("autor.id").is(usuarioId).and("usuario_calificado_id").is(calificadoId)), CalificacionViaje.class)) {
			throw new ApiException(CodigoError.ALREADY_RATED, REPETIDA);
		}

		CalificacionViaje nueva = CalificacionViaje.builder()
				.id(new ObjectId())
				.viajeId(viaje.id())
				.reservaId(reserva.id())
				.autor(new ReferenciaNombre(usuarioId,
						ReglasUsuario.nombrePublico(autor.getNombres(), autor.getApellidos())))
				.usuarioCalificadoId(calificadoId)
				.rolCalificado(autorPasajero ? Rol.CONDUCTOR : Rol.PASAJERO)
				.puntaje(solicitud.score())
				.comentario(solicitud.comment())
				.fechaCreacion(ahora)
				.build();
		Calificacion[] promedio = new Calificacion[1];
		try {
			enTransaccion(() -> {
				mongoTemplate.insert(nueva);
				promedio[0] = promedioDe(calificadoId);
				mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(calificadoId)),
						new Update().set("calificacion", promedio[0]).set("fecha_actualizacion", ahora), Usuario.class);
			});
		} catch (DuplicateKeyException ex) {
			// Dos envíos simultáneos: el índice único deja pasar solo uno.
			throw new ApiException(CodigoError.ALREADY_RATED, REPETIDA);
		}
		// La copia del promedio en los viajes activos del calificado (si es conductor) se actualiza aparte, como las
		// demás copias: los terminados quedan como registro histórico.
		mongoTemplate.updateMulti(Query.query(Criteria.where("conductor.id").is(calificadoId)
						.and("estado").in(EstadoViaje.PUBLICADO, EstadoViaje.EN_CURSO)),
				new Update().set("conductor.calificacion", promedio[0]).set("fecha_actualizacion", ahora), Viaje.class);
		return CalificacionDto.desde(nueva);
	}

	// ------------------------------------------------------------------ Apoyo

	/** Promedio de todas las calificaciones recibidas, redondeado a un decimal. */
	Calificacion promedioDe(ObjectId calificadoId) {
		Aggregation agregacion = Aggregation.newAggregation(
				Aggregation.match(Criteria.where("usuario_calificado_id").is(calificadoId)),
				Aggregation.group().avg("puntaje").as("promedio").count().as("cantidad"));
		Document resultado = mongoTemplate.aggregate(agregacion, COLECCION, Document.class).getUniqueMappedResult();
		if (resultado == null || !(resultado.get("cantidad") instanceof Number cantidad) || cantidad.intValue() == 0) {
			return null;
		}
		double promedio = ((Number) resultado.get("promedio")).doubleValue();
		return new Calificacion(Math.round(promedio * 10) / 10.0, cantidad.intValue());
	}

	private void enTransaccion(Runnable cambios) {
		TransactionTemplate transaccion = new TransactionTemplate(transactionManager);
		for (int intento = 1;; intento++) {
			try {
				transaccion.executeWithoutResult(estado -> cambios.run());
				return;
			} catch (TransientDataAccessException ex) {
				if (intento == INTENTOS) {
					throw ex;
				}
			}
		}
	}

	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
