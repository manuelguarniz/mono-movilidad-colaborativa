package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.CancelacionesConductorService.Bloqueo;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Lo que impide reservar a un pasajero: una reserva activa (RN-23) o el límite de cancelaciones (RN-38).
 * Cuentan sus reservas canceladas por él y las NO_SE_PRESENTO dentro de la ventana.
 */
@Service
@RequiredArgsConstructor
public class RestriccionesPasajeroService {

	private static final String COLECCION_RESERVAS = "reservas";
	/** Reserva activa = CONFIRMADA o EN_VIAJE (README, sección 2.2). */
	public static final List<String> ESTADOS_RESERVA_ACTIVA = List.of("CONFIRMADA", "EN_VIAJE");

	private final MongoTemplate mongoTemplate;
	private final ParametrosService parametrosService;

	public Optional<Reserva> reservaActiva(ObjectId pasajeroId) {
		Query consulta = Query.query(Criteria.where("pasajero.id").is(pasajeroId)
				.and("estado").in(ESTADOS_RESERVA_ACTIVA));
		return Optional.ofNullable(mongoTemplate.findOne(consulta, Reserva.class));
	}

	public Optional<Bloqueo> bloqueo(ObjectId pasajeroId, Instant ahora) {
		Parametros parametros = parametrosService.leer();
		Date desde = Date.from(ahora.minus(Duration.ofDays(parametros.ventanaCancelacionesDias())));
		// La fecha de una reserva NO_SE_PRESENTO es la de su último cambio de estado.
		Query consulta = Query.query(Criteria.where("pasajero.id").is(pasajeroId).orOperator(
				Criteria.where("estado").is("CANCELADA").and("cancelada_por").is("PASAJERO")
						.and("fecha_cancelacion").gte(desde),
				Criteria.where("estado").is("NO_SE_PRESENTO").and("fecha_actualizacion").gte(desde)));
		consulta.fields().include("estado", "fecha_cancelacion", "fecha_actualizacion");
		List<Instant> fechas = mongoTemplate.find(consulta, Document.class, COLECCION_RESERVAS).stream()
				.map(reserva -> reserva.getDate("CANCELADA".equals(reserva.getString("estado"))
						? "fecha_cancelacion" : "fecha_actualizacion"))
				.filter(Objects::nonNull)
				.map(Date::toInstant)
				.sorted()
				.toList();
		return CancelacionesConductorService.evaluar(fechas, parametros.maxCancelacionesPasajero(),
				parametros.ventanaCancelacionesDias());
	}
}
