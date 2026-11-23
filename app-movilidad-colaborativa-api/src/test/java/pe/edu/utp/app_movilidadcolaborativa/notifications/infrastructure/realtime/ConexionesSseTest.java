package pe.edu.utp.app_movilidadcolaborativa.notifications.infrastructure.realtime;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** Registro de conexiones SSE por usuario (RF-13), sin servidor. */
class ConexionesSseTest {

	private final ConexionesSse conexiones = new ConexionesSse();
	private final ObjectId usuarioId = new ObjectId();

	@Test
	void cadaConexionDuraHastaQueVenceElTokenConUnTope() {
		SseEmitter corta = conexiones.abrir(usuarioId, Instant.now().plus(5, ChronoUnit.MINUTES), 0);
		assertThat(corta.getTimeout()).isBetween(299_000L, 300_000L);

		SseEmitter larga = conexiones.abrir(usuarioId, Instant.now().plus(8, ChronoUnit.HOURS), 0);
		assertThat(larga.getTimeout()).isEqualTo(ConexionesSse.DURACION_MAXIMA.toMillis());
	}

	@Test
	void unUsuarioPuedeTenerVariasConexiones() {
		assertThat(conexiones.conectado(usuarioId)).isFalse();
		conexiones.abrir(usuarioId, null, 3);
		conexiones.abrir(usuarioId, null, 3);
		conexiones.abrir(new ObjectId(), null, 0);

		assertThat(conexiones.conectado(usuarioId)).isTrue();
		assertThat(conexiones.abiertas()).isEqualTo(3);
		// Antes de que el servidor inicialice la respuesta, los eventos quedan en cola: no falla.
		conexiones.enviar(usuarioId, "unread-count", 4);
		conexiones.enviar(new ObjectId(), "unread-count", 1);
	}
}
