package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

/** Promedio (redondeado a un decimal) y cantidad de calificaciones recibidas; se recalcula con cada una (RN-47). */
public record Calificacion(Double promedio, Integer cantidad) {
}
