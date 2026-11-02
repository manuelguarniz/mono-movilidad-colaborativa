package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Copia de la sede dentro del viaje. ciudad es la etiqueta del dashboard (RN-49), copiada de sedes.distrito.nombre
 * al publicar; null en los viajes anteriores.
 */
public record SedeViaje(@Field("id") ObjectId id, String nombre, String ciudad) {
}
