package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import org.bson.types.ObjectId;

public record Foto(ObjectId archivoId, String url) {
}
