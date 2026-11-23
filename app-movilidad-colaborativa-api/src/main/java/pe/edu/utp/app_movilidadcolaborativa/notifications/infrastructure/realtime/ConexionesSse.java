package pe.edu.utp.app_movilidadcolaborativa.notifications.infrastructure.realtime;

import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.NoLeidasDto;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Conexiones SSE abiertas en esta instancia, por usuario (un usuario puede tener varias: pestañas o dispositivos).
 * No guarda estado de negocio: si la instancia se reinicia, el cliente se reconecta y recibe el contador al conectar
 * (RNF-10). Cada conexión se cierra cuando vence el token, para que el cliente vuelva con uno vigente.
 */
@Slf4j
@Component
public class ConexionesSse {

	/** Tope de cada conexión aunque el token dure más: el cliente se reconecta sin que el usuario lo note. */
	static final Duration DURACION_MAXIMA = Duration.ofMinutes(30);
	/** Espera sugerida al cliente antes de reconectarse. */
	static final long RECONEXION_MS = 3_000;

	private final Map<ObjectId, Set<SseEmitter>> conexiones = new ConcurrentHashMap<>();

	/** Abre la conexión y envía de inmediato el contador, que también sirve para ponerse al día tras reconectar. */
	public SseEmitter abrir(ObjectId usuarioId, Instant venceToken, long noLeidas) {
		long hastaVencer = venceToken == null ? DURACION_MAXIMA.toMillis()
				: Duration.between(Instant.now(), venceToken).toMillis();
		SseEmitter emisor = new SseEmitter(Math.max(1_000, Math.min(DURACION_MAXIMA.toMillis(), hastaVencer)));
		conexiones.computeIfAbsent(usuarioId, clave -> ConcurrentHashMap.newKeySet()).add(emisor);
		emisor.onCompletion(() -> quitar(usuarioId, emisor));
		emisor.onTimeout(() -> {
			quitar(usuarioId, emisor);
			emisor.complete();
		});
		emisor.onError(error -> quitar(usuarioId, emisor));
		enviar(usuarioId, emisor, SseEmitter.event().reconnectTime(RECONEXION_MS).name("unread-count")
				.data(new NoLeidasDto(noLeidas), MediaType.APPLICATION_JSON));
		return emisor;
	}

	public boolean conectado(ObjectId usuarioId) {
		Set<SseEmitter> emisores = conexiones.get(usuarioId);
		return emisores != null && !emisores.isEmpty();
	}

	/** Envía el evento a todas las conexiones del usuario en esta instancia. */
	public void enviar(ObjectId usuarioId, String evento, Object dato) {
		for (SseEmitter emisor : List.copyOf(conexiones.getOrDefault(usuarioId, Set.of()))) {
			enviar(usuarioId, emisor, SseEmitter.event().name(evento).data(dato, MediaType.APPLICATION_JSON));
		}
	}

	/** Un comentario cada 25 s evita que un proxy o el WebView corten la conexión por inactividad. */
	@Scheduled(fixedRate = 25_000, initialDelay = 25_000)
	void latido() {
		conexiones.forEach((usuarioId, emisores) -> List.copyOf(emisores)
				.forEach(emisor -> enviar(usuarioId, emisor, SseEmitter.event().comment("ping"))));
	}

	int abiertas() {
		return conexiones.values().stream().mapToInt(Set::size).sum();
	}

	private void enviar(ObjectId usuarioId, SseEmitter emisor, SseEmitter.SseEventBuilder evento) {
		try {
			emisor.send(evento);
		} catch (IOException | IllegalStateException ex) {
			// El cliente se fue (cerró la app o perdió la red): se descarta la conexión.
			log.debug("Conexión SSE cerrada para {}", usuarioId);
			quitar(usuarioId, emisor);
		}
	}

	private void quitar(ObjectId usuarioId, SseEmitter emisor) {
		conexiones.computeIfPresent(usuarioId, (clave, emisores) -> {
			emisores.remove(emisor);
			return emisores.isEmpty() ? null : emisores;
		});
	}
}
