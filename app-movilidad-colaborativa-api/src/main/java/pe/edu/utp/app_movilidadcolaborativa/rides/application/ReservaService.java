package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.ResumenViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.VehiculoResumen;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ReservaRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.validation.ReglasUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/** Reserva de plazas en un viaje publicado (RF-04, RN-23, RN-38). */
@Service
@RequiredArgsConstructor
public class ReservaService {

	private static final int INTENTOS = 3;
	public static final String MENSAJE_RESERVA_ACTIVA =
			"Ya tienes una reserva activa. Cancélala para reservar otro viaje.";
	private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM").withZone(ReglasViaje.ZONA_PERU);

	/** Mensaje de RN-38, con la fecha desde la que podrá reservar de nuevo. */
	public static String mensajeBloqueo(CancelacionesConductorService.Bloqueo bloqueo) {
		return "Cancelaste o no te presentaste a %d viajes en los últimos %d días. Podrás reservar de nuevo desde el %s."
				.formatted(bloqueo.cancelaciones(), bloqueo.ventanaDias(), DIA_MES.format(bloqueo.hasta()));
	}

	private final UsuarioRepository usuarioRepository;
	private final ViajeRepository viajeRepository;
	private final ReservaRepository reservaRepository;
	private final MongoTemplate mongoTemplate;
	private final PlatformTransactionManager transactionManager;
	private final RestriccionesPasajeroService restriccionesPasajeroService;

	/** Descuenta las plazas y crea la reserva CONFIRMADA en una misma transacción. */
	public void reservar(ObjectId usuarioId, ObjectId viajeId, int plazas) {
		Usuario pasajero = usuarioRepository.findById(usuarioId)
				.filter(usuario -> usuario.getEstado() != EstadoUsuario.BLOQUEADO)
				.orElseThrow(() -> new ApiException(CodigoError.UNAUTHORIZED));
		if (pasajero.getEstado() == EstadoUsuario.PERFIL_PENDIENTE) {
			throw new ApiException(CodigoError.PROFILE_INCOMPLETE, "Completa tu perfil antes de reservar un viaje");
		}
		Viaje viaje = viajeRepository.findById(viajeId)
				.orElseThrow(() -> new ApiException(CodigoError.RIDE_NOT_FOUND, "Viaje no encontrado"));
		if (usuarioId.equals(viaje.conductor().id())) {
			throw new ApiException(CodigoError.OWN_RIDE, "No puedes reservar tu propio viaje");
		}
		Instant ahora = Instant.now();
		if (viaje.estado() != EstadoViaje.PUBLICADO || !viaje.fechaSalida().isAfter(ahora)) {
			throw new ApiException(CodigoError.RIDE_NOT_AVAILABLE, "Este viaje ya no está disponible");
		}
		if (reservaRepository.existsByViajeIdAndPasajeroIdAndEstado(viajeId, usuarioId, EstadoReserva.CONFIRMADA)) {
			throw yaReservado();
		}
		// RN-23: una sola reserva activa en total.
		if (restriccionesPasajeroService.reservaActiva(usuarioId).isPresent()) {
			throw new ApiException(CodigoError.ACTIVE_BOOKING_EXISTS, MENSAJE_RESERVA_ACTIVA);
		}
		// RN-38: límite de cancelaciones del pasajero.
		restriccionesPasajeroService.bloqueo(usuarioId, ahora).ifPresent(bloqueo -> {
			throw new ApiException(CodigoError.PASSENGER_CANCELLATION_LIMIT, mensajeBloqueo(bloqueo),
					Map.of("count", bloqueo.cancelaciones(), "until", bloqueo.hasta()));
		});
		if (viaje.plazasDisponibles() < plazas) {
			throw sinPlazas();
		}

		Reserva reserva = Reserva.builder()
				.id(new ObjectId())
				.viajeId(viajeId)
				.pasajero(new ReferenciaNombre(usuarioId,
						ReglasUsuario.nombrePublico(pasajero.getNombres(), pasajero.getApellidos())))
				.viaje(new ResumenViaje(viaje.origen().etiqueta(), viaje.destino().etiqueta(), viaje.fechaSalida(),
						viaje.conductor().nombre(), new VehiculoResumen(viaje.vehiculo().marca(),
								viaje.vehiculo().modelo(), viaje.vehiculo().color())))
				.plazas(plazas)
				.totalCreditos(plazas * viaje.precioPorPlaza())
				.estado(EstadoReserva.CONFIRMADA)
				.fechaCreacion(ahora)
				.fechaActualizacion(ahora)
				.build();
		try {
			guardar(reserva);
		} catch (DuplicateKeyException ex) {
			// Dos reservas simultáneas del mismo pasajero: el índice único rechaza la segunda.
			throw yaReservado();
		}
	}

	// Dos pasajeros que reservan el mismo viaje a la vez chocan dentro de la transacción: se reintenta.
	private void guardar(Reserva reserva) {
		TransactionTemplate transaccion = new TransactionTemplate(transactionManager);
		for (int intento = 1;; intento++) {
			try {
				transaccion.executeWithoutResult(estado -> descontarPlazasYGuardar(reserva));
				return;
			} catch (TransientDataAccessException ex) {
				if (intento == INTENTOS) {
					throw ex;
				}
			}
		}
	}

	// El filtro por plazas suficientes hace atómico el descuento y evita la sobreventa.
	private void descontarPlazasYGuardar(Reserva reserva) {
		Query conPlazas = Query.query(Criteria.where("_id").is(reserva.viajeId())
				.and("estado").is(EstadoViaje.PUBLICADO)
				.and("plazas_disponibles").gte(reserva.plazas()));
		Update descuento = new Update()
				.inc("plazas_disponibles", -reserva.plazas())
				.set("fecha_actualizacion", reserva.fechaCreacion());
		if (mongoTemplate.updateFirst(conPlazas, descuento, Viaje.class).getModifiedCount() == 0) {
			throw sinPlazas();
		}
		mongoTemplate.insert(reserva);
	}

	private static ApiException sinPlazas() {
		return new ApiException(CodigoError.NO_SEATS_AVAILABLE, "Este viaje ya no tiene asientos disponibles");
	}

	private static ApiException yaReservado() {
		return new ApiException(CodigoError.ALREADY_BOOKED, "Ya tienes una reserva confirmada en este viaje");
	}
}
