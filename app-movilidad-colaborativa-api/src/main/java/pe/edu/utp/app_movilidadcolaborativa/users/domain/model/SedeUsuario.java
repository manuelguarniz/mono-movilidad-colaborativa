package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Field;

/** Copia de la sede dentro del usuario: id, nombre y dirección. */
public record SedeUsuario(@Field("id") ObjectId id, String nombre, String direccion) {
}
