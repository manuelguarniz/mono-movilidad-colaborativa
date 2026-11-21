package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.ratings.application.CalificacionService;
import pe.edu.utp.app_movilidadcolaborativa.ratings.domain.model.CalificacionViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto.CalificacionesDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto.DadaDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto.EntradaDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto.PasajeroDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.HistorialDto.VehiculoDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Conductor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.LugarResumen;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto.Sede;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Actor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.VehiculoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Historial (RF-09, RN-50): como pasajero, sus reservas COMPLETADA, CANCELADA y NO_SE_PRESENTO; como conductor, sus
 * viajes COMPLETADO y CANCELADO. Del más reciente al más antiguo por hora de salida, 20 por página, sin límite de
 * antigüedad. Cada viaje completado trae lo que el usuario puede calificar (RF-10, RN-47).
 */
@Service
@RequiredArgsConstructor
public class HistorialService {

	static final int TAMANO_PAGINA = 20;
	private static final List<EstadoReserva> FINALES_PASAJERO =
			List.of(EstadoReserva.COMPLETADA, EstadoReserva.CANCELADA, EstadoReserva.NO_SE_PRESENTO);

	private final UsuarioRepository usuarioRepository;
	private final ViajeRepository viajeRepository;
	private final MongoTemplate mongoTemplate;
	private final ParametrosService parametrosService;

	public HistorialDto consultar(ObjectId usuarioId, Rol rol, int pagina) {
		buscarUsuario(usuarioId);
		int dias = parametrosService.leer().diasParaCalificar();
		Instant ahora = Instant.now();
		return rol == Rol.CONDUCTOR ? comoConductor(usuarioId, pagina, dias, ahora)
				: comoPasajero(usuarioId, pagina, dias, ahora);
	}

	// ------------------------------------------------------------------ Pasajero

	private HistorialDto comoPasajero(ObjectId usuarioId, int pagina, int dias, Instant ahora) {
		Query consulta = Query.query(Criteria.where("pasajero.id").is(usuarioId).and("estado").in(FINALES_PASAJERO))
				.with(Sort.by(Sort.Direction.DESC, "viaje.fecha_salida").and(Sort.by(Sort.Direction.DESC, "_id")));
		List<Reserva> encontradas = pagina(consulta, pagina, Reserva.class);
		boolean hayMas = encontradas.size() > TAMANO_PAGINA;
		List<Reserva> reservas = hayMas ? encontradas.subList(0, TAMANO_PAGINA) : encontradas;

		Map<ObjectId, Viaje> viajes = porId(viajeRepository.findAllById(
				reservas.stream().map(Reserva::viajeId).distinct().toList()), Viaje::id);
		Map<ObjectId, CalificacionViaje> dadas = reservas.isEmpty() ? Map.of()
				: mongoTemplate.find(Query.query(Criteria.where("autor.id").is(usuarioId)
								.and("reserva_id").in(reservas.stream().map(Reserva::id).toList())), CalificacionViaje.class)
						.stream().collect(Collectors.toMap(CalificacionViaje::reservaId, Function.identity(), (a, b) -> a));

		List<EntradaDto> data = reservas.stream()
				.map(reserva -> entradaPasajero(reserva, viajes.get(reserva.viajeId()), dadas.get(reserva.id()), dias,
						ahora))
				.toList();
		return new HistorialDto(data, pagina, hayMas);
	}

	static EntradaDto entradaPasajero(Reserva reserva, Viaje viaje, CalificacionViaje dada, int dias, Instant ahora) {
		// Sin el viaje (borrado), la tarjeta sale de la copia de la reserva.
		LugarResumen origen = viaje != null ? LugarResumen.desde(viaje.origen())
				: new LugarResumen(reserva.viaje().origen(), null);
		LugarResumen destino = viaje != null ? LugarResumen.desde(viaje.destino())
				: new LugarResumen(reserva.viaje().destino(), null);
		Conductor conductor = viaje != null ? Conductor.desde(viaje.conductor())
				: new Conductor(null, reserva.viaje().conductor(), null, null);

		CalificacionesDto calificacion = null;
		if (reserva.estado() == EstadoReserva.COMPLETADA && viaje != null && viaje.estado() == EstadoViaje.COMPLETADO) {
			Instant hasta = CalificacionService.plazo(viaje, dias);
			calificacion = new CalificacionesDto(hasta, hasta != null && ahora.isBefore(hasta), dada == null ? 1 : 0,
					dada == null ? List.of()
							: List.of(new DadaDto(viaje.conductor().id().toHexString(), viaje.conductor().nombre(),
									dada.puntaje())));
		}
		return new EntradaDto(
				reserva.id().toHexString(),
				reserva.viajeId().toHexString(),
				Rol.PASAJERO.getApi(),
				estado(reserva.estado()),
				reserva.canceladaPor() == null ? null : reserva.canceladaPor().getApi(),
				reserva.viaje().fechaSalida(),
				viaje == null ? null : viaje.fechaFin(),
				viaje == null ? null : Sede.desde(viaje.sede()),
				origen,
				destino,
				reserva.plazas(),
				// Las reservas anteriores a la billetera (liquidada ausente) no movieron créditos.
				reserva.liquidada() == null ? 0 : reserva.totalCreditos(),
				conductor,
				viaje == null ? null : vehiculo(viaje.vehiculo()),
				null, null, null,
				calificacion);
	}

	// ----------------------------------------------------------------- Conductor

	private HistorialDto comoConductor(ObjectId usuarioId, int pagina, int dias, Instant ahora) {
		Query consulta = Query.query(Criteria.where("conductor.id").is(usuarioId)
						.and("estado").in(EstadoViaje.COMPLETADO, EstadoViaje.CANCELADO))
				.with(Sort.by(Sort.Direction.DESC, "fecha_salida").and(Sort.by(Sort.Direction.DESC, "_id")));
		List<Viaje> encontrados = pagina(consulta, pagina, Viaje.class);
		boolean hayMas = encontrados.size() > TAMANO_PAGINA;
		List<Viaje> viajes = hayMas ? encontrados.subList(0, TAMANO_PAGINA) : encontrados;
		List<ObjectId> ids = viajes.stream().map(Viaje::id).toList();

		Map<ObjectId, List<Reserva>> reservas = ids.isEmpty() ? Map.of()
				: mongoTemplate.find(Query.query(Criteria.where("viaje_id").in(ids).and("estado").in(FINALES_PASAJERO))
								.with(Sort.by(Sort.Direction.ASC, "fecha_creacion")), Reserva.class)
						.stream().collect(Collectors.groupingBy(Reserva::viajeId));
		Map<ObjectId, CalificacionViaje> dadas = ids.isEmpty() ? Map.of()
				: mongoTemplate.find(Query.query(Criteria.where("autor.id").is(usuarioId).and("viaje_id").in(ids)),
								CalificacionViaje.class)
						.stream().collect(Collectors.toMap(CalificacionViaje::reservaId, Function.identity(), (a, b) -> a));
		Map<ObjectId, Usuario> pasajeros = porId(usuarioRepository.findAllById(reservas.values().stream()
				.flatMap(List::stream).filter(reserva -> reserva.estado() == EstadoReserva.COMPLETADA)
				.map(reserva -> reserva.pasajero().id()).distinct().toList()), Usuario::getId);

		List<EntradaDto> data = viajes.stream()
				.map(viaje -> entradaConductor(viaje, reservas.getOrDefault(viaje.id(), List.of()), dadas, pasajeros,
						dias, ahora))
				.toList();
		return new HistorialDto(data, pagina, hayMas);
	}

	static EntradaDto entradaConductor(Viaje viaje, List<Reserva> reservas, Map<ObjectId, CalificacionViaje> dadas,
			Map<ObjectId, Usuario> pasajeros, int dias, Instant ahora) {
		List<Reserva> subieron = reservas.stream().filter(r -> r.estado() == EstadoReserva.COMPLETADA).toList();
		int ausentes = (int) reservas.stream().filter(r -> r.estado() == EstadoReserva.NO_SE_PRESENTO).count();
		int reembolsadas = (int) reservas.stream().filter(r -> r.estado() == EstadoReserva.CANCELADA
				&& (r.canceladaPor() == Actor.CONDUCTOR || r.canceladaPor() == Actor.SISTEMA)).count();
		// RN-40: se cobra lo de los que subieron y lo de los ausentes, una vez liquidado.
		int cobrado = reservas.stream()
				.filter(r -> r.estado() == EstadoReserva.COMPLETADA || r.estado() == EstadoReserva.NO_SE_PRESENTO)
				.filter(r -> Boolean.TRUE.equals(r.liquidada()))
				.mapToInt(r -> Objects.requireNonNullElse(r.totalCreditos(), 0)).sum();

		CalificacionesDto calificacion = null;
		if (viaje.estado() == EstadoViaje.COMPLETADO) {
			Instant hasta = CalificacionService.plazo(viaje, dias);
			List<DadaDto> hechas = subieron.stream().filter(r -> dadas.containsKey(r.id()))
					.map(r -> new DadaDto(r.pasajero().id().toHexString(), r.pasajero().nombre(),
							dadas.get(r.id()).puntaje()))
					.toList();
			calificacion = new CalificacionesDto(hasta, hasta != null && ahora.isBefore(hasta),
					subieron.size() - hechas.size(), hechas);
		}
		return new EntradaDto(
				viaje.id().toHexString(),
				viaje.id().toHexString(),
				Rol.CONDUCTOR.getApi(),
				viaje.estado().getApi(),
				viaje.canceladoPor() == null ? null : viaje.canceladoPor().getApi(),
				viaje.fechaSalida(),
				viaje.fechaFin(),
				Sede.desde(viaje.sede()),
				LugarResumen.desde(viaje.origen()),
				LugarResumen.desde(viaje.destino()),
				null,
				cobrado,
				null,
				vehiculo(viaje.vehiculo()),
				subieron.stream().map(r -> {
					Usuario pasajero = pasajeros.get(r.pasajero().id());
					return new PasajeroDto(r.id().toHexString(), r.pasajero().id().toHexString(), r.pasajero().nombre(),
							pasajero == null || pasajero.getFoto() == null ? null : pasajero.getFoto().url(),
							r.plazas());
				}).toList(),
				ausentes,
				reembolsadas,
				calificacion);
	}

	// ------------------------------------------------------------------ Apoyo

	private static String estado(EstadoReserva estado) {
		return switch (estado) {
			case COMPLETADA -> "COMPLETED";
			case NO_SE_PRESENTO -> "NO_SHOW";
			default -> "CANCELLED";
		};
	}

	private static VehiculoDto vehiculo(VehiculoViaje vehiculo) {
		return vehiculo == null ? null
				: new VehiculoDto(vehiculo.marca(), vehiculo.modelo(), vehiculo.color(), vehiculo.placa());
	}

	// Se pide uno más que la página para saber si hay otra.
	private <T> List<T> pagina(Query consulta, int pagina, Class<T> tipo) {
		consulta.skip((long) (pagina - 1) * TAMANO_PAGINA).limit(TAMANO_PAGINA + 1);
		return mongoTemplate.find(consulta, tipo);
	}

	private static <T> Map<ObjectId, T> porId(Iterable<T> elementos, Function<T, ObjectId> id) {
		Map<ObjectId, T> mapa = new HashMap<>();
		elementos.forEach(elemento -> mapa.put(id.apply(elemento), elemento));
		return mapa;
	}

	private Usuario buscarUsuario(ObjectId usuarioId) {
		return usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
	}
}
