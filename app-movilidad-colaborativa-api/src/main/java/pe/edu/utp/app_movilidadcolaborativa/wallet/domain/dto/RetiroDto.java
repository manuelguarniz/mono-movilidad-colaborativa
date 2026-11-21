package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto;

import java.time.Instant;

/** Retiro solicitado: queda PENDING (21-F) y balance es el saldo disponible después del descuento. */
public record RetiroDto(String id, int credits, String phoneLast3, String status, Instant requestedAt, int balance) {
}
