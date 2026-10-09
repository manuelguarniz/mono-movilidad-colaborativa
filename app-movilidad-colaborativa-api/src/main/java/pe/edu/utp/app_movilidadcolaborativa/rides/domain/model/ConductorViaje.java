package pe.edu.utp.app_movilidadcolaborativa.rides.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Field;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;

/** Copia del conductor dentro del viaje. El @Field explícito evita que Spring Data guarde el campo como _id. */
public record ConductorViaje(@Field("id") ObjectId id, String nombre, String fotoUrl, Calificacion calificacion) {
}
