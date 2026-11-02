package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Sede;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.SedeRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.FiltroViajesRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ListadoViajesDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ListadoViajesDto.ReservaActivaDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.LugarDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.PublicarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeDetalleDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.ConductorViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Lugar;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.SedeViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.SentidoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.VehiculoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto.BloqueoCancelacionesDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Soat;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Listado, detalle y publicación de viajes (RF-03, RF-05). */
@Service
@RequiredArgsConstructor
public class ViajeService {

	/** RF-03: 20 viajes por página. */
	public static final int TAMANO_PAGINA = 20;
	private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM").withZone(ReglasViaje.ZONA_PERU);

	private final UsuarioRepository usuarioRepository;
	private final ViajeRepository viajeRepository;
	private final MongoTemplate mongoTemplate;
	private final CancelacionesConductorService cancelacionesConductorService;
	private final RestriccionesPasajeroService restriccionesPasajeroService;
	private final SedeRepository sedeRepository;

	/**
	 * Página del listado del dashboard (RF-03): viajes PUBLICADO de todas las sedes (RN-49), con salida futura y
	 * plazas suficientes, sin los del propio usuario, ordenados por hora de salida. Con campusId, solo esa sede;
	 * con time, solo los viajes de hoy desde esa hora; con accessible, solo los vehículos aptos (RN-19). Trae
	 * además la reserva activa (RN-23) y el bloqueo por cancelaciones (RN-38) del pasajero.
	 */
	public ListadoViajesDto listar(ObjectId usuarioId, FiltroViajesRequest filtro) {
		buscarUsuario(usuarioId);
		Instant ahora = Instant.now();
		Criteria criterios = Criteria.where("estado").is(EstadoViaje.PUBLICADO)
				.and("plazas_disponibles").gte(filtro.passengers() == null ? 1 : Integer.parseInt(filtro.passengers()))
				.and("conductor.id").ne(usuarioId);
		if (filtro.campusId() != null) {
			criterios.and("sede.id").is(new ObjectId(filtro.campusId()));
		}
		if (filtro.soloAccesibles()) {
			criterios.and("vehiculo.apto_movilidad_reducida").is(true);
		}
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

		// Se pide uno más que el tamaño de la página para saber si hay otra.
		int pagina = filtro.pagina();
		Query consulta = Query.query(criterios)
				.with(Sort.by(Sort.Direction.ASC, "fecha_salida").and(Sort.by("_id")))
				.skip((long) (pagina - 1) * TAMANO_PAGINA)
				.limit(TAMANO_PAGINA + 1);
		List<ViajeResumenDto> viajes = mongoTemplate.find(consulta, Viaje.class).stream()
				.map(ViajeResumenDto::desde).toList();
		boolean hayMas = viajes.size() > TAMANO_PAGINA;

		return new ListadoViajesDto(
				hayMas ? viajes.subList(0, TAMANO_PAGINA) : viajes,
				pagina,
				hayMas,
				restriccionesPasajeroService.reservaActiva(usuarioId).map(ReservaActivaDto::desde).orElse(null),
				restriccionesPasajeroService.bloqueo(usuarioId, ahora)
						.map(bloqueo -> new BloqueoCancelacionesDto(bloqueo.cancelaciones(), bloqueo.hasta()))
						.orElse(null));
	}

	/** Viajes PUBLICADO y EN_CURSO del conductor, por hora de salida: el resumen del dashboard en modo conductor. */
	public List<ViajeResumenDto> listarPropios(ObjectId usuarioId) {
		buscarUsuario(usuarioId);
		Query consulta = Query.query(Criteria.where("conductor.id").is(usuarioId)
						.and("estado").in(EstadoViaje.PUBLICADO, EstadoViaje.EN_CURSO))
				.with(Sort.by(Sort.Direction.ASC, "fecha_salida"));
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
	 * Exige un vehículo ACTIVO (RN-24), no haber superado el límite de cancelaciones (RN-30) y, si el
	 * vehículo declaró SOAT, que siga vigente en la fecha de salida (RN-37).
	 */
	public ViajeDetalleDto publicar(ObjectId usuarioId, PublicarViajeRequest solicitud) {
		Usuario usuario = buscarUsuario(usuarioId);
		Vehiculo vehiculo = usuario.getVehiculo();
		if (vehiculo == null || vehiculo.estado() != EstadoVehiculo.ACTIVO) {
			throw new ApiException(CodigoError.VEHICLE_REQUIRED, "Registra un vehículo para publicar viajes");
		}
		cancelacionesConductorService.bloqueo(usuarioId, Instant.now()).ifPresent(bloqueo -> {
			throw new ApiException(CodigoError.DRIVER_CANCELLATION_LIMIT,
					"Cancelaste %d viajes en los últimos %d días. Podrás publicar de nuevo desde el %s."
							.formatted(bloqueo.cancelaciones(), bloqueo.ventanaDias(), DIA_MES.format(bloqueo.hasta())),
					Map.of("count", bloqueo.cancelaciones(), "until", bloqueo.hasta()));
		});
		// El SOAT es opcional mientras los formularios del vehículo no lo pidan: sin SOAT no se valida.
		Soat soat = vehiculo.soat();
		if (soat != null && !soat.vigenteEn(Soat.fechaPeru(solicitud.departureTime()))) {
			throw new ApiException(CodigoError.SOAT_EXPIRES_BEFORE_DEPARTURE,
					"Tu SOAT vence antes de la salida. Actualízalo en tu perfil para publicar.");
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

		// En milisegundos, la precisión de MongoDB: la respuesta coincide con lo que se lee después.
		Instant ahora = Instant.now().truncatedTo(ChronoUnit.MILLIS);
		Viaje viaje = Viaje.builder()
				.id(new ObjectId())
				.conductor(new ConductorViaje(usuarioId,
						ReglasUsuario.nombrePublico(usuario.getNombres(), usuario.getApellidos()),
						usuario.getFoto() == null ? null : usuario.getFoto().url(),
						usuario.getCalificacion()))
				.vehiculo(new VehiculoViaje(vehiculo.marca(), vehiculo.modelo(), vehiculo.color(), vehiculo.placa(),
						vehiculo.esApto(), soat == null ? null : soat.fechaFin()))
				.sede(new SedeViaje(usuario.getSede().id(), usuario.getSede().nombre(), ciudad(usuario)))
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

	// RN-49: la ciudad es el distrito de la sede en el catálogo (sedes.distrito.nombre).
	private String ciudad(Usuario usuario) {
		return sedeRepository.findById(usuario.getSede().id()).map(Sede::ciudad).orElse(null);
	}

	// El token puede seguir vigente aunque la cuenta ya no exista o haya sido bloqueada.
	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
