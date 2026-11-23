package pe.edu.utp.app_movilidadcolaborativa.notifications.infrastructure.realtime;

import com.mongodb.MongoCommandException;
import com.mongodb.client.MongoChangeStreamCursor;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import com.mongodb.client.model.changestream.FullDocument;
import com.mongodb.client.model.changestream.OperationType;
import lombok.extern.slf4j.Slf4j;
import org.bson.BsonDocument;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.SmartLifecycle;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;
import pe.edu.utp.app_movilidadcolaborativa.notifications.application.NotificacionService;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.NoLeidasDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.NotificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.NotificacionNuevaDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.Notificacion;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Tiempo real de RF-13: cada instancia abre un único Change Stream sobre notificaciones y reparte los cambios a las
 * conexiones SSE que tiene abiertas. Así llega el aviso aunque la notificación la haya creado otra instancia o el job
 * (RNF-10), y solo después del commit (RN-32). Un insert se envía como «notification»; un cambio de leida, como
 * «unread-count», agrupado por usuario para que «Marcar todas» no dispare 50 eventos.
 * Se apaga con app.notifications.realtime=false (por ejemplo, en pruebas sin Atlas).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.notifications.realtime", havingValue = "true", matchIfMissing = true)
public class EscuchaNotificaciones implements SmartLifecycle {

	static final String COLECCION = "notificaciones";
	private static final long AGRUPAR_MS = 300;
	private static final long ESPERA_INICIAL_MS = 1_000;
	private static final long ESPERA_MAXIMA_MS = 30_000;
	/** El resume token ya no está en el oplog: se sigue desde ahora. */
	private static final int HISTORIA_PERDIDA = 286;

	private static final List<Bson> FILTRO = List.of(Aggregates.match(Filters.or(
			Filters.eq("operationType", "insert"),
			Filters.and(Filters.eq("operationType", "update"),
					Filters.exists("updateDescription.updatedFields.leida")))));

	private final MongoTemplate mongoTemplate;
	private final ConexionesSse conexiones;
	private final NotificacionService notificacionService;
	private final ScheduledExecutorService agrupador = Executors.newSingleThreadScheduledExecutor(
			Thread.ofVirtual().name("contador-notificaciones").factory());
	private final Set<ObjectId> contadoresPendientes = ConcurrentHashMap.newKeySet();

	private volatile boolean activo;
	private volatile MongoChangeStreamCursor<ChangeStreamDocument<Document>> cursor;
	private BsonDocument reanudarDesde;
	private Thread hilo;

	public EscuchaNotificaciones(MongoTemplate mongoTemplate, ConexionesSse conexiones,
			NotificacionService notificacionService) {
		this.mongoTemplate = mongoTemplate;
		this.conexiones = conexiones;
		this.notificacionService = notificacionService;
	}

	@Override
	public void start() {
		activo = true;
		hilo = Thread.ofVirtual().name("escucha-notificaciones").start(this::escuchar);
	}

	@Override
	public void stop() {
		activo = false;
		MongoChangeStreamCursor<?> abierto = cursor;
		if (abierto != null) {
			try {
				abierto.close();
			} catch (RuntimeException ignorada) {
				// Se está apagando la aplicación.
			}
		}
		if (hilo != null) {
			hilo.interrupt();
		}
		agrupador.shutdownNow();
	}

	@Override
	public boolean isRunning() {
		return activo;
	}

	// Si el stream se corta (red, elección de primario, cluster pausado), se reabre desde el último cambio visto.
	private void escuchar() {
		long espera = ESPERA_INICIAL_MS;
		while (activo) {
			try {
				var stream = mongoTemplate.getCollection(COLECCION).watch(FILTRO)
						.fullDocument(FullDocument.UPDATE_LOOKUP);
				if (reanudarDesde != null) {
					stream = stream.resumeAfter(reanudarDesde);
				}
				try (MongoChangeStreamCursor<ChangeStreamDocument<Document>> abierto = stream.cursor()) {
					cursor = abierto;
					log.info("Escuchando cambios de {} (Change Stream)", COLECCION);
					espera = ESPERA_INICIAL_MS;
					while (activo) {
						ChangeStreamDocument<Document> cambio = abierto.next();
						reanudarDesde = cambio.getResumeToken();
						procesar(cambio);
					}
				}
			} catch (RuntimeException ex) {
				if (!activo) {
					return;
				}
				if (ex instanceof MongoCommandException comando && comando.getErrorCode() == HISTORIA_PERDIDA) {
					reanudarDesde = null;
				}
				log.warn("Change Stream de {} interrumpido; se reintenta en {} ms: {}", COLECCION, espera,
						ex.getMessage());
				try {
					Thread.sleep(espera);
				} catch (InterruptedException interrumpido) {
					Thread.currentThread().interrupt();
					return;
				}
				espera = Math.min(espera * 2, ESPERA_MAXIMA_MS);
			}
		}
	}

	void procesar(ChangeStreamDocument<Document> cambio) {
		Document documento = cambio.getFullDocument();
		if (documento == null) {
			return;
		}
		try {
			ObjectId usuarioId = documento.getObjectId("usuario_id");
			if (usuarioId == null || !conexiones.conectado(usuarioId)) {
				return;
			}
			if (cambio.getOperationType() == OperationType.INSERT) {
				Notificacion notificacion = mongoTemplate.getConverter().read(Notificacion.class, documento);
				conexiones.enviar(usuarioId, "notification", new NotificacionNuevaDto(
						NotificacionDto.desde(notificacion), notificacionService.noLeidas(usuarioId)));
			} else if (contadoresPendientes.add(usuarioId)) {
				agrupador.schedule(() -> enviarContador(usuarioId), AGRUPAR_MS, TimeUnit.MILLISECONDS);
			}
		} catch (RuntimeException ex) {
			// Un cambio que no se pudo enviar no detiene el stream: el cliente se pone al día al reconectar.
			log.warn("No se pudo enviar la notificación en tiempo real: {}", ex.getMessage());
		}
	}

	private void enviarContador(ObjectId usuarioId) {
		contadoresPendientes.remove(usuarioId);
		try {
			conexiones.enviar(usuarioId, "unread-count", new NoLeidasDto(notificacionService.noLeidas(usuarioId)));
		} catch (RuntimeException ex) {
			log.warn("No se pudo enviar el contador en tiempo real: {}", ex.getMessage());
		}
	}
}
