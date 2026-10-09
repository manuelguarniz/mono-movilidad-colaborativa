package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

/** Estado del código OTP vigente, en segundos, para el contador de la pantalla de verificación. */
public record OtpInfoDto(long expiresIn, long resendAfter, int attemptsLeft) {
}
