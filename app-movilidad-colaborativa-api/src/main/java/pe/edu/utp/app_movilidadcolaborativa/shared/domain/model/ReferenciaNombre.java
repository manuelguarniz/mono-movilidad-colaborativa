package pe.edu.utp.app_movilidadcolaborativa.shared.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Copia del id y el nombre de un documento de otra colección.
 * El @Field explícito evita que Spring Data guarde el campo como _id.
 */
public record ReferenciaNombre(@Field("id") ObjectId id, String nombre) {
}
