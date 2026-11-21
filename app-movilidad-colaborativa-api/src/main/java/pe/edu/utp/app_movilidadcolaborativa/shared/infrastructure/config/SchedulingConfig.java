package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Habilita los jobs @Scheduled (RF-08). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
