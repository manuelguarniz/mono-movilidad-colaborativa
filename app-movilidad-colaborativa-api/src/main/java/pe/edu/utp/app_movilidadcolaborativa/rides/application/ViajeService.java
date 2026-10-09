package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.FiltroViajesRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.LugarDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.PublicarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeDetalleDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.ConductorViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Lugar;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.SentidoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.VehiculoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** Listado, detalle y publicación de viajes (RF-09 a RF-12 y RF-15 a RF-18). */
@Service
@RequiredArgsConstructor
public class ViajeService {

	private final UsuarioRepository usuarioRepository;
	private final ViajeRepository viajeRepository;
	private final MongoTemplate mongoTemplate;

	/**
	 * Viajes PUBLICADO de una sede, con salida futura y plazas suficientes, sin los del propio usuario.
	 * Sin campusId se usa la sede del usuario; con time, solo los viajes de hoy desde esa hora.
	 */
	public List<ViajeResumenDto> listar(ObjectId usuarioId, FiltroViajesRequest filtro) {
		Usuario usuario = buscarUsuario(usuarioId);
		ObjectId sedeId = filtro.campusId() != null ? new ObjectId(filtro.campusId())
				: usuario.getSede() == null ? null : usuario.getSede().id();
		if (sedeId == null) {
			return List.of();
		}

		Instant ahora = Instant.now();
		Criteria criterios = Criteria.where("estado").is(EstadoViaje.PUBLICADO)
				.and("sede.id").is(sedeId)
				.and("plazas_disponibles").gte(filtro.passengers() == null ? 1 : Integer.parseInt(filtro.passengers()))
				.and("conductor.id").ne(usuarioId);
		if (filtro.time() == null) {
			criterios.and("fecha_salida").gt(ahora);
		} else {
			LocalDate hoy = LocalDate.ofInstant(ahora, ReglasViaje.ZONA_PERU);
			Instant desde = hoy.atTime(LocalTime.parse(filtro.time())).atZone(ReglasViaje.ZONA_PERU).toInstant();
			Instant manana = hoy.plusDays(1).atStartOfDay(ReglasViaje.ZONA_PERU).toInstant();
			// La salida siempre es futura, aunque la hora pedida ya haya pasado.
			if (desde.isAfter(ahora)) {
				criterios.and("fecha_salida").gte(desde).lt(manana);
			} else {
				criterios.and("fecha_salida").gt(ahora).lt(manana);
			}
		}
		if (filtro.destination() != null) {
			String patron = ReglasViaje.patronSinTildes(filtro.destination());
			criterios.orOperator(Criteria.where("destino.etiqueta").regex(patron, "i"),
					Criteria.where("destino.direccion").regex(patron, "i"));
		}

		Query consulta = Query.query(criterios).with(Sort.by(Sort.Direction.ASC, "fecha_salida"));
		return mongoTemplate.find(consulta, Viaje.class).stream().map(ViajeResumenDto::desde).toList();
	}

	/** Responde para cualquier estado del viaje. */
	public ViajeDetalleDto consultar(ObjectId viajeId) {
		return viajeRepository.findById(viajeId).map(ViajeDetalleDto::desde)
				.orElseThrow(() -> new ApiException(CodigoError.RIDE_NOT_FOUND, "Viaje no encontrado"));
	}

	/**
	 * Crea el viaje en PUBLICADO. Conductor, vehículo y sede se copian del usuario; la distancia es
	 * la línea recta entre origen, paradas y destino, y la duración una estimación a partir de ella.
	 */
	public ViajeDetalleDto publicar(ObjectId usuarioId, PublicarViajeRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		Vehiculo vehiculo = usuario.getVehiculo();
		if (vehiculo == null) {
			throw new ApiException(CodigoError.VEHICLE_REQUIRED, "Registra un vehículo para publicar viajes");
		}
		// RN-11: depende del vehículo guardado, así que no se puede validar en el DTO.
		if (solicitud.seats() > vehiculo.plazas()) {
			throw new ValidacionException("seats", "Las plazas no pueden superar las de tu vehículo");
		}

		Lugar origen = solicitud.origin().aLugar();
		Lugar destino = solicitud.destination().aLugar();
		List<Lugar> paradas = solicitud.stops().stream().map(LugarDto::aLugar).toList();
		List<GeoJsonPoint> ruta = new ArrayList<>();
		ruta.add(origen.ubicacion());
		paradas.forEach(parada -> ruta.add(parada.ubicacion()));
		ruta.add(destino.ubicacion());
		double distanciaKm = ReglasViaje.distanciaKm(ruta);

		Instant ahora = Instant.now();
		Viaje viaje = Viaje.builder()
				.id(new ObjectId())
				.conductor(new ConductorViaje(usuarioId,
						ReglasUsuario.nombrePublico(usuario.getNombres(), usuario.getApellidos()),
						usuario.getFoto() == null ? null : usuario.getFoto().url(),
						usuario.getCalificacion()))
				.vehiculo(new VehiculoViaje(vehiculo.marca(), vehiculo.modelo(), vehiculo.color(), vehiculo.placa()))
				.sede(new ReferenciaNombre(usuario.getSede().id(), usuario.getSede().nombre()))
				.sentido(SentidoViaje.desdeApi(solicitud.direction()))
				.origen(origen)
				.destino(destino)
				.paradas(paradas)
				.distanciaKm(distanciaKm)
				.duracionMin(ReglasViaje.duracionMin(distanciaKm))
				.fechaSalida(solicitud.departureTime())
				.precioPorPlaza(solicitud.pricePerSeat())
				.plazasTotales(solicitud.seats())
				.plazasDisponibles(solicitud.seats())
				.condiciones(solicitud.conditions())
				.estado(EstadoViaje.PUBLICADO)
				.fechaCreacion(ahora)
				.fechaActualizacion(ahora)
				.build();
		viajeRepository.insert(viaje);
		return ViajeDetalleDto.desde(viaje);
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
