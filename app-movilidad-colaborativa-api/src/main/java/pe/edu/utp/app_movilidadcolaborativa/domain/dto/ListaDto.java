package pe.edu.utp.app_movilidadcolaborativa.domain.dto;

import java.util.List;

/** Envoltorio de las listas: { "data": [...] }. */
public record ListaDto<T>(List<T> data) {
}
