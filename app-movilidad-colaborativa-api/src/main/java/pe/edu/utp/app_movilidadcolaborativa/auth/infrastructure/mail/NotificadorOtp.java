package pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config.AppProperties;

/** Entrega el código OTP: por correo (SMTP) o, con app.mail.enabled=false, en el log. */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificadorOtp {

	private final JavaMailSender mailSender;
	private final AppProperties propiedades;

	public void enviar(String correo, String codigo) {
		if (!propiedades.mail().enabled()) {
			log.info("Correo desactivado (MAIL_ENABLED=false). Código OTP para {}: {}", correo, codigo);
			return;
		}
		long minutos = propiedades.otp().ttl().toMinutes();
		SimpleMailMessage mensaje = new SimpleMailMessage();
		mensaje.setFrom(propiedades.mail().from());
		mensaje.setTo(correo);
		mensaje.setSubject("Tu código de verificación de ColaboraCar");
		mensaje.setText("""
				Hola,

				Tu código de verificación de ColaboraCar es: %s

				El código vence en %d minutos. Si no intentaste iniciar sesión, ignora este correo.
				""".formatted(codigo, minutos));
		try {
			mailSender.send(mensaje);
		} catch (MailException ex) {
			log.error("No se pudo enviar el código OTP a {}", correo, ex);
			throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
					"No pudimos enviar el código de verificación. Inténtalo nuevamente.");
		}
	}
}
