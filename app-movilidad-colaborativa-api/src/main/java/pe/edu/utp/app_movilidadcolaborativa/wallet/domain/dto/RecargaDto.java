package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto;

import java.time.Instant;

/** Recarga aprobada (21-D): créditos acreditados y nuevo saldo disponible. */
public record RecargaDto(int credits, int balance, String operationCode, Instant createdAt) {
}
