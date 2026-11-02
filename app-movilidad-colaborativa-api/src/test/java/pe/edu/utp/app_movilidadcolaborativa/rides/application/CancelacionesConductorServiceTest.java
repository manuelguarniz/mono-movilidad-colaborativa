package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Límite de cancelaciones del conductor (RN-30) con los parámetros de la colección app (RN-31). */
class CancelacionesConductorServiceTest {

	private static final Instant AHORA = Instant.parse("2026-11-01T15:00:00Z");

	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final CancelacionesConductorService servicio =
			new CancelacionesConductorService(mongoTemplate, new ParametrosService(mongoTemplate));
	private final ObjectId conductorId = new ObjectId();

	// Una cancelación por día, de la más antigua (hace n días) a la más reciente (ayer).
	private void cancelaciones(int cantidad) {
		List<Document> viajes = IntStream.range(0, cantidad)
				.mapToObj(i -> new Document("fecha_cancelacion", Date.from(AHORA.minus(Duration.ofDays(cantidad - i)))))
				.toList();
		when(mongoTemplate.find(any(Query.class), eq(Document.class), eq("viajes"))).thenReturn(viajes);
	}

	private void parametros(Document config) {
		when(mongoTemplate.findById("config", Document.class, "app")).thenReturn(config);
	}

	@Test
	void pordebajoDelLimiteNoHayBloqueo() {
		cancelaciones(9);

		assertThat(servicio.bloqueo(conductorId, AHORA)).isEmpty();
	}

	@Test
	void enElLimiteSeBloqueaHastaQueSalgaLaCancelacionMasAntigua() {
		cancelaciones(12);

		CancelacionesConductorService.Bloqueo bloqueo = servicio.bloqueo(conductorId, AHORA).orElseThrow();

		assertThat(bloqueo.cancelaciones()).isEqualTo(12);
		assertThat(bloqueo.ventanaDias()).isEqualTo(30);
		// Con 12 hay que esperar a que salgan las 3 más antiguas: la tercera fue hace 10 días.
		assertThat(bloqueo.hasta()).isEqualTo(AHORA.minus(Duration.ofDays(10)).plus(Duration.ofDays(30)));

		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(consulta.capture(), eq(Document.class), eq("viajes"));
		assertThat(consulta.getValue().getQueryObject())
				.containsEntry("conductor.id", conductorId)
				.containsEntry("estado", "CANCELADO")
				.containsEntry("cancelado_por", new Document("$in", List.of("CONDUCTOR", "SISTEMA")))
				.containsEntry("fecha_cancelacion", new Document("$gte", AHORA.minus(Duration.ofDays(30))));
	}

	@Test
	void usaLosParametrosDeLaColeccionApp() {
		parametros(new Document("_id", "config").append("max_cancelaciones_conductor", 3)
				.append("ventana_cancelaciones_dias", 7));
		cancelaciones(3);

		CancelacionesConductorService.Bloqueo bloqueo = servicio.bloqueo(conductorId, AHORA).orElseThrow();

		assertThat(bloqueo.ventanaDias()).isEqualTo(7);
		assertThat(bloqueo.hasta()).isEqualTo(AHORA.minus(Duration.ofDays(3)).plus(Duration.ofDays(7)));
	}
}
