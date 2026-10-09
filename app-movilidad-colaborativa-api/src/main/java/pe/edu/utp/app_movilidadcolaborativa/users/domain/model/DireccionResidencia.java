package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

public record DireccionResidencia(String etiqueta, String direccion, GeoJsonPoint ubicacion) {
}
