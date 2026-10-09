package pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;

@Document("distritos")
public record Distrito(@Id ObjectId id, String codigo, String nombre, ReferenciaNombre departamento) {
}
