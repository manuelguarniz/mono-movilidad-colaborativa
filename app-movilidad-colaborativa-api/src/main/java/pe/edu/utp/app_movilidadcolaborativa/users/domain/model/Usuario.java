package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;

import java.time.Instant;
import java.util.List;

/**
 * Colección usuarios. Solo declara los campos que usan los módulos ya implementados,
 * así que después de crear el documento se actualiza con $set y nunca con save():
 * reemplazarlo entero borraría los campos que esta clase todavía no conoce.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("usuarios")
public class Usuario {

	@Id
	private ObjectId id;
	@Indexed(unique = true)
	private String correo;
	private String contrasenaHash;
	private String nombres;
	private String apellidos;
	private ReferenciaNombre departamento;
	private ReferenciaNombre distrito;
	private SedeUsuario sede;
	private List<Rol> roles;
	private Rol modoActivo;
	private EstadoUsuario estado;
	private Foto foto;
	private Instant fechaAceptacionTerminos;
	private Instant fechaCreacion;
	private Instant fechaActualizacion;
}
