package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Límite de cancelaciones del conductor (RN-30). Cuentan sus viajes CANCELADO por él o por el sistema (RN-44)
 * con fecha_cancelacion dentro de la ventana. El bloqueo se levanta solo cuando el conteo baja del límite.
 */
@Service
@RequiredArgsConstructor
public class CancelacionesConductorService {

	private static final String COLECCION_VIAJES = "viajes";
	private static final List<String> CANCELADO_POR = List.of("CONDUCTOR", "SISTEMA");

	private final MongoTemplate mongoTemplate;
	private final ParametrosService parametrosService;

	/** Conductor bloqueado: cuántos viajes canceló en la ventana y desde cuándo podrá publicar de nuevo. */
	public record Bloqueo(int cancelaciones, int ventanaDias, Instant hasta) {
	}

	/**
	 * Contador de Mis viajes (17-B): cancelaciones en la ventana, el límite, el bloqueo actual y el que tendría si
	 * cancelara un viaje ahora (la advertencia de 17-D).
	 */
	public record Contador(int cancelaciones, int limite, int ventanaDias, Instant bloqueadoHasta,
			Instant bloqueadoHastaSiCancela) {
	}

	public Optional<Bloqueo> bloqueo(ObjectId conductorId, Instant ahora) {
		Parametros parametros = parametrosService.leer();
		return evaluar(fechas(conductorId, ahora, parametros), parametros.maxCancelacionesConductor(),
				parametros.ventanaCancelacionesDias());
	}

	public Contador contador(ObjectId conductorId, Instant ahora) {
		Parametros parametros = parametrosService.leer();
		return contador(fechas(conductorId, ahora, parametros), ahora, parametros.maxCancelacionesConductor(),
				parametros.ventanaCancelacionesDias());
	}

	/** También lo usa el pasajero (RN-38). */
	static Contador contador(List<Instant> fechas, Instant ahora, int limite, int ventanaDias) {
		List<Instant> conLaSiguiente = new ArrayList<>(fechas);
		conLaSiguiente.add(ahora);
		return new Contador(fechas.size(), limite, ventanaDias,
				evaluar(fechas, limite, ventanaDias).map(Bloqueo::hasta).orElse(null),
				evaluar(conLaSiguiente, limite, ventanaDias).map(Bloqueo::hasta).orElse(null));
	}

	private List<Instant> fechas(ObjectId conductorId, Instant ahora, Parametros parametros) {
		Duration ventana = Duration.ofDays(parametros.ventanaCancelacionesDias());
		Query consulta = Query.query(Criteria.where("conductor.id").is(conductorId)
						.and("estado").is(EstadoViaje.CANCELADO.name())
						.and("cancelado_por").in(CANCELADO_POR)
						.and("fecha_cancelacion").gte(ahora.minus(ventana)))
				.with(Sort.by(Sort.Direction.ASC, "fecha_cancelacion"));
		consulta.fields().include("fecha_cancelacion");
		return mongoTemplate.find(consulta, Document.class, COLECCION_VIAJES).stream()
				.map(viaje -> viaje.getDate("fecha_cancelacion").toInstant())
				.toList();
	}

	/**
	 * Bloqueo a partir de las fechas de las cancelaciones dentro de la ventana, de la más antigua a la más
	 * reciente. Lo usan el conductor (RN-30) y el pasajero (RN-38).
	 */
	static Optional<Bloqueo> evaluar(List<Instant> fechas, int limite, int ventanaDias) {
		if (fechas.size() < limite) {
			return Optional.empty();
		}
		// Para bajar del límite tienen que salir de la ventana las (N − límite + 1) cancelaciones más antiguas.
		Instant hasta = fechas.get(fechas.size() - limite).plus(Duration.ofDays(ventanaDias));
		return Optional.of(new Bloqueo(fechas.size(), ventanaDias, hasta));
	}
}
