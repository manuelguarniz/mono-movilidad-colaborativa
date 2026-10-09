package pe.edu.utp.app_movilidadcolaborativa.users.application;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.Archivo;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.PropositoArchivo;
import pe.edu.utp.app_movilidadcolaborativa.files.infrastructure.persistence.ArchivoRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.ActualizarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.DireccionResidencia;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.SedeUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoDocumento;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Reglas de estado del perfil (RF-19 a RF-21, RN-14), sin base de datos. */
class PerfilServiceTest {

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final ArchivoRepository archivoRepository = mock(ArchivoRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final PerfilService servicio = new PerfilService(usuarioRepository, archivoRepository, mongoTemplate);
	private final ObjectId usuarioId = new ObjectId();

	private Usuario.UsuarioBuilder pasajero() {
		return Usuario.builder()
				.id(usuarioId)
				.correo("carlos.mendoza@utp.edu.pe")
				.contrasenaHash("hash")
				.nombres("Carlos Alberto")
				.apellidos("Mendoza Ruiz")
				.departamento(new ReferenciaNombre(new ObjectId(), "La Libertad"))
				.distrito(new ReferenciaNombre(new ObjectId(), "Trujillo"))
				.sede(new SedeUsuario(new ObjectId(), "UTP Sede Trujillo", "Av. Nicolás de Piérola 1221, Trujillo"))
				.roles(List.of(Rol.PASAJERO))
				.modoActivo(Rol.PASAJERO)
				.estado(EstadoUsuario.ACTIVO)
				.fechaCreacion(Instant.parse("2026-10-01T15:04:00Z"));
	}

	private Usuario.UsuarioBuilder conductor() {
		return pasajero()
				.roles(List.of(Rol.PASAJERO, Rol.CONDUCTOR))
				.telefono("+51987654321")
				.tipoDocumento(TipoDocumento.DNI)
				.numeroDocumento("45678912")
				.vehiculo(new Vehiculo("ABC-123", TipoVehiculo.MOTO, "Toyota", "Yaris", "Blanco", 2021, 3,
						"45678912", true, EstadoVehiculo.ACTIVO, null, null, Instant.parse("2026-10-02T10:00:00Z")));
	}

	private void existe(Usuario usuario) {
		when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
	}

	private static ActualizarPerfilRequest solicitud(String tipo, String numero, String modo) {
		return new ActualizarPerfilRequest(null, "Carlos Alberto", "Mendoza Ruiz", tipo, numero, "+51987654321", modo);
	}

	private Document cambiosDelUsuario() {
		ArgumentCaptor<Update> cambios = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(any(Query.class), cambios.capture(), eq(Usuario.class));
		return cambios.getValue().getUpdateObject().get("$set", Document.class);
	}

	@Test
	void consultarDevuelveElPerfilCompletoSinLaContrasena() {
		existe(conductor()
				.direccionResidencia(new DireccionResidencia("Víctor Larco Herrera", "Av. Larco 1250",
						new GeoJsonPoint(-79.0437, -8.1321)))
				.modoActivo(Rol.CONDUCTOR)
				.build());

		PerfilUsuarioDto perfil = servicio.consultar(usuarioId);

		assertThat(perfil.id()).isEqualTo(usuarioId.toHexString());
		assertThat(perfil.documentType()).isEqualTo("DNI");
		assertThat(perfil.roles()).containsExactly("PASSENGER", "DRIVER");
		assertThat(perfil.activeMode()).isEqualTo("DRIVER");
		assertThat(perfil.status()).isEqualTo("ACTIVE");
		assertThat(perfil.campus().address()).isEqualTo("Av. Nicolás de Piérola 1221, Trujillo");
		assertThat(perfil.homeAddress().location()).isEqualTo(new PerfilUsuarioDto.Punto(-8.1321, -79.0437));
		assertThat(perfil.vehicle().type()).isEqualTo("MOTORCYCLE");
		assertThat(perfil.vehicle().status()).isEqualTo("ACTIVE");
		assertThat(perfil.vehicle().photoUrl()).isNull();
		assertThat(perfil.stats()).isEqualTo(new PerfilUsuarioDto.EstadisticasDto(0, 0, 0));
		assertThat(perfil.rating()).isNull();
		assertThat(perfil.toString()).doesNotContain("hash");
	}

	@Test
	void unaCuentaInexistenteOBloqueadaRespondeUnauthorized() {
		when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> servicio.consultar(usuarioId))
				.isInstanceOfSatisfying(ApiException.class,
						ex -> assertThat(ex.getCodigo()).isEqualTo(CodigoError.UNAUTHORIZED));

		existe(pasajero().estado(EstadoUsuario.BLOQUEADO).build());
		assertThatThrownBy(() -> servicio.actualizar(usuarioId, solicitud("DNI", "72345678", "PASSENGER")))
				.isInstanceOfSatisfying(ApiException.class,
						ex -> assertThat(ex.getCodigo()).isEqualTo(CodigoError.UNAUTHORIZED));
		verifyNoInteractions(mongoTemplate);
	}

	@Test
	void elPerfilPendienteNoSePuedeActualizar() {
		existe(Usuario.builder().id(usuarioId).roles(List.of()).estado(EstadoUsuario.PERFIL_PENDIENTE).build());

		assertThatThrownBy(() -> servicio.actualizar(usuarioId, solicitud("DNI", "72345678", "PASSENGER")))
				.isInstanceOfSatisfying(ApiException.class,
						ex -> assertThat(ex.getCodigo()).isEqualTo(CodigoError.PROFILE_INCOMPLETE));
		verifyNoInteractions(mongoTemplate);
	}

	@Test
	void elDocumentoSeRegistraLaPrimeraVez() {
		existe(pasajero().build());

		servicio.actualizar(usuarioId, solicitud("CE", "AB1234567", "PASSENGER"));

		Document cambios = cambiosDelUsuario();
		assertThat(cambios).containsEntry("tipo_documento", TipoDocumento.CE)
				.containsEntry("numero_documento", "AB1234567")
				.containsEntry("telefono", "+51987654321")
				.containsEntry("modo_activo", Rol.PASAJERO)
				.doesNotContainKey("foto");
		verify(mongoTemplate, never()).updateMulti(any(Query.class), any(Update.class), any(String.class));
	}

	@Test
	void elDocumentoEsObligatorioYSeValidaSegunSuTipo() {
		existe(pasajero().build());

		assertThat(erroresDe(solicitud(null, null, "PASSENGER"))).containsExactly(
				new ErrorCampo("documentNumber", "El número de documento es obligatorio"),
				new ErrorCampo("documentType", "El tipo de documento es obligatorio"));
		assertThat(erroresDe(solicitud("PASAPORTE", "72345678", "PASSENGER"))).containsExactly(
				new ErrorCampo("documentType", "El tipo de documento no es válido"));
		assertThat(erroresDe(solicitud("DNI", "7234567A", "PASSENGER"))).containsExactly(
				new ErrorCampo("documentNumber", "El DNI debe tener 8 dígitos"));
		assertThat(erroresDe(solicitud("CE", "AB-12345", "PASSENGER"))).containsExactly(
				new ErrorCampo("documentNumber", "El carné de extranjería debe tener entre 8 y 12 letras o números"));
		verifyNoInteractions(mongoTemplate);
	}

	private List<ErrorCampo> erroresDe(ActualizarPerfilRequest solicitud) {
		return catchThrowableOfType(ValidacionException.class, () -> servicio.actualizar(usuarioId, solicitud))
				.getErrores();
	}

	@Test
	void elDocumentoYaRegistradoSeIgnora() {
		existe(conductor().build());

		servicio.actualizar(usuarioId, solicitud("CE", "no válido", "DRIVER"));

		assertThat(cambiosDelUsuario()).doesNotContainKeys("tipo_documento", "numero_documento")
				.containsEntry("modo_activo", Rol.CONDUCTOR);
	}

	@Test
	void laModalidadConductorExigeUnVehiculo() {
		existe(pasajero().build());

		assertThatThrownBy(() -> servicio.actualizar(usuarioId, solicitud("DNI", "72345678", "DRIVER")))
				.isInstanceOfSatisfying(ApiException.class,
						ex -> assertThat(ex.getCodigo()).isEqualTo(CodigoError.VEHICLE_REQUIRED));
		verifyNoInteractions(mongoTemplate);
	}

	@Test
	void laFotoDebeSerDelUsuarioYDePerfil() {
		existe(pasajero().build());
		ObjectId archivoId = new ObjectId();
		ActualizarPerfilRequest conFoto = new ActualizarPerfilRequest(archivoId.toHexString(), "Carlos", "Mendoza",
				"DNI", "72345678", "+51987654321", "PASSENGER");

		when(archivoRepository.findById(archivoId)).thenReturn(Optional.of(new Archivo(archivoId, usuarioId,
				PropositoArchivo.FOTO_VEHICULO, "vehiculos/a.jpg", "/uploads/vehiculos/a.jpg", "image/jpeg", 1,
				Instant.now())));
		assertThatThrownBy(() -> servicio.actualizar(usuarioId, conFoto))
				.isInstanceOfSatisfying(ApiException.class,
						ex -> assertThat(ex.getCodigo()).isEqualTo(CodigoError.INVALID_FILE_REFERENCE));
		verifyNoInteractions(mongoTemplate);

		when(archivoRepository.findById(archivoId)).thenReturn(Optional.of(new Archivo(archivoId, usuarioId,
				PropositoArchivo.FOTO_PERFIL, "perfiles/a.jpg", "/uploads/perfiles/a.jpg", "image/jpeg", 1,
				Instant.now())));
		servicio.actualizar(usuarioId, conFoto);
		assertThat(cambiosDelUsuario()).containsEntry("foto", new Foto(archivoId, "/uploads/perfiles/a.jpg"));
	}

	@Test
	void elCambioDeNombreActualizaLaCopiaEnLosViajesActivos() {
		existe(conductor().build());

		servicio.actualizar(usuarioId, new ActualizarPerfilRequest(null, "Carlos Alberto", "Mendoza Ruiz", null, null,
				"+51999888777", "DRIVER"));
		verify(mongoTemplate, never()).updateMulti(any(Query.class), any(Update.class), any(String.class));

		servicio.actualizar(usuarioId, new ActualizarPerfilRequest(null, "Juan Carlos", "Ñahui", null, null,
				"+51999888777", "DRIVER"));
		ArgumentCaptor<Query> filtro = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> copia = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateMulti(filtro.capture(), copia.capture(), eq("viajes"));
		assertThat(filtro.getValue().getQueryObject()).containsEntry("conductor.id", usuarioId)
				.containsEntry("estado", new Document("$in", List.of("PUBLICADO", "EN_CURSO")));
		assertThat(copia.getValue().getUpdateObject().get("$set", Document.class))
				.containsExactly(java.util.Map.entry("conductor.nombre", "Juan Ñ."));
	}
}
