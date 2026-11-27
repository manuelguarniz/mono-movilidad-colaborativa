package pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.scheduling;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.MisViajesService;

/**
 * RN-44 (parte de RF-08): cada minuto cancela los viajes PUBLICADO que no se iniciaron hasta
 * {@code minutos_tolerancia_inicio} después de la salida, con reembolso a sus pasajeros.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CancelacionViajesNoIniciadosJob {

	private final MisViajesService misViajesService;

	@Scheduled(fixedDelayString = "${app.jobs.cancelacion-no-iniciados:60s}", initialDelayString = "20s")
	public void ejecutar() {
		try {
			int cancelados = misViajesService.cancelarNoIniciados();
			if (cancelados > 0) {
				log.info("Viajes no iniciados cancelados por el sistema: {}", cancelados);
			}
		} catch (RuntimeException ex) {
			// Se reintenta en la siguiente ejecución: cada cancelación está condicionada a que siga PUBLICADO.
			log.error("No se pudieron cancelar los viajes no iniciados", ex);
		}
	}
}
