package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

/** Punto de una ruta: origen, destino o parada. */
public record Lugar(String etiqueta, String direccion, GeoJsonPoint ubicacion) {
}
