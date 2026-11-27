package pe.edu.utp.app_movilidadcolaborativa.wallet.infrastructure.scheduling;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.edu.utp.app_movilidadcolaborativa.wallet.application.BilleteraService;

/**
 * RN-42: cada minuto devuelve los créditos de los retiros que el operador marcó RECHAZADO en la base de datos. Es la
 * parte de la billetera del job de RF-08; la cancelación de los viajes no iniciados está en CancelacionViajesNoIniciadosJob y el cierre automático sigue
 * pendiente.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReversionRetirosJob {

	private final BilleteraService billeteraService;

	@Scheduled(fixedDelayString = "${app.jobs.reversion-retiros:60s}", initialDelayString = "30s")
	public void ejecutar() {
		try {
			int revertidos = billeteraService.revertirRechazados();
			if (revertidos > 0) {
				log.info("Retiros rechazados devueltos: {}", revertidos);
			}
		} catch (RuntimeException ex) {
			// Se reintenta en la siguiente ejecución: reversion_aplicada evita devolver dos veces.
			log.error("No se pudieron devolver los retiros rechazados", ex);
		}
	}
}
