package pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto;

import java.util.List;

/** Página de movimientos, del más reciente al más antiguo, 20 por página (RF-11). */
public record MovimientosDto(List<MovimientoDto> data, int page, boolean hasMore) {
}
