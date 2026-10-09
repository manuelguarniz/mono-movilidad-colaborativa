package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import org.springframework.data.mongodb.core.mapping.Field;

/** El @Field explícito fija el nombre del campo, que la conversión a snake_case partiría en el dígito. */
public record Estadisticas(Integer viajes, Integer cumplimiento, @Field("ahorro_co2_kg") Double ahorroCo2Kg) {
}
