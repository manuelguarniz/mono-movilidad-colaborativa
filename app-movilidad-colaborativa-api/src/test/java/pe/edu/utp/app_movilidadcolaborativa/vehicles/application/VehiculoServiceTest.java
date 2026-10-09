package pe.edu.utp.app_movilidadcolaborativa.vehicles.application;

import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.Archivo;
import pe.edu.utp.app_movilidadcolaborativa.files.domain.model.PropositoArchivo;
import pe.edu.utp.app_movilidadcolaborativa.files.infrastructure.persistence.ArchivoRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.VehiculoDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoDocumento;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.ActualizarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.RegistrarVehiculoRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Camino feliz y reglas de estado del vehículo (RF-07, RF-08, RF-22), sin base de datos. */
class VehiculoServiceTest {

	private static final Instant REGISTRO = Instant.parse("2026-10-02T10:00:00Z");

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final ArchivoRepository archivoRepository = mock(ArchivoRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final VehiculoService servicio = new VehiculoService(usuarioRepository, archivoRepository, mongoTemplate);
	private final ObjectId usuarioId = new ObjectId();
	private final Foto foto = new Foto(new ObjectId(), "/uploads/vehiculos/a.jpg");

	private Usuario.UsuarioBuilder pasajero() {
		return Usuario.builder()
				.id(usuarioId)
				.nombres("Carlos Alberto")
				.apellidos("Mendoza Ruiz")
				.roles(List.of(Rol.PASAJERO))
				.modoActivo(Rol.PASAJERO)
				.estado(EstadoUsuario.ACTIVO);
	}

	private Usuario conductor() {
		return pasajero()
				.roles(List.of(Rol.PASAJERO, Rol.CONDUCTOR))
				.vehiculo(new Vehiculo("ABC-123", TipoVehiculo.SEDAN, "Toyota", "Yaris", "Blanco", 2021, 3,
						"45678912", true, EstadoVehiculo.ACTIVO, foto, REGISTRO, REGISTRO))
				.build();
	}

	private void existe(Usuario usuario) {
		when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
	}

	private void laActualizacionModifica(long documentos) {
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Usuario.class)))
				.thenReturn(UpdateResult.acknowledged(documentos, documentos, null));
	}

	private static RegistrarVehiculoRequest registro(String archivoId) {
		return new RegistrarVehiculoRequest("abc123", "MOTORCYCLE", "Honda", "CB190", "Rojo", 2022, 1, "45678912",
				null, true, archivoId);
	}

	private static ActualizarVehiculoRequest actualizacion(String placa, Integer plazas) {
		return new ActualizarVehiculoRequest(placa, "SEDAN", "Toyota", "Yaris", "Blanco", 2021, plazas, null, null,
				true, null);
	}

	private static void falla(Runnable accion, CodigoError codigo) {
		assertThatThrownBy(accion::run).isInstanceOfSatisfying(ApiException.class,
				ex -> assertThat(ex.getCodigo()).isEqualTo(codigo));
	}

	// ------------------------------------------------------------ Camino feliz

	@Test
	void registrarGuardaElVehiculoEnElUsuarioYLoHaceConductor() {
		existe(pasajero().build());
		laActualizacionModifica(1);
		ObjectId archivoId = new ObjectId();
		when(archivoRepository.findById(archivoId)).thenReturn(Optional.of(new Archivo(archivoId, usuarioId,
				PropositoArchivo.FOTO_VEHICULO, "vehiculos/b.jpg", "/uploads/vehiculos/b.jpg", "image/jpeg", 1,
				Instant.now())));

		VehiculoDto respuesta = servicio.registrar(usuarioId, registro(archivoId.toHexString()));

		assertThat(respuesta.plate()).isEqualTo("ABC-123");
		assertThat(respuesta.type()).isEqualTo("MOTORCYCLE");
		assertThat(respuesta.isOwner()).isFalse();
		assertThat(respuesta.status()).isEqualTo("ACTIVE");
		assertThat(respuesta.photoUrl()).isEqualTo("/uploads/vehiculos/b.jpg");
		assertThat(respuesta.registeredAt()).isNotNull();

		ArgumentCaptor<Query> filtro = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> cambios = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(filtro.capture(), cambios.capture(), eq(Usuario.class));
		assertThat(filtro.getValue().getQueryObject()).containsEntry("_id", usuarioId)
				.containsEntry("vehiculo", new Document("$exists", false));
		Document actualizacion = cambios.getValue().getUpdateObject();
		Vehiculo guardado = actualizacion.get("$set", Document.class).get("vehiculo", Vehiculo.class);
		assertThat(guardado.placa()).isEqualTo("ABC-123");
		assertThat(guardado.tipo()).isEqualTo(TipoVehiculo.MOTO);
		assertThat(guardado.dniPropietario()).isEqualTo("45678912");
		assertThat(guardado.estado()).isEqualTo(EstadoVehiculo.ACTIVO);
		assertThat(guardado.fechaAceptacionTerminos()).isEqualTo(guardado.fechaRegistro()).isNotNull();
		assertThat(actualizacion.get("$addToSet", Document.class)).containsEntry("roles", Rol.CONDUCTOR);
	}

	@Test
	void consultarDevuelveElVehiculoDelConductor() {
		existe(conductor());

		assertThat(servicio.consultar(usuarioId)).isEqualTo(new VehiculoDto("ABC-123", "SEDAN", "Toyota", "Yaris",
				"Blanco", 2021, 3, "45678912", true, "ACTIVE", "/uploads/vehiculos/a.jpg", REGISTRO));
	}

	@Test
	void actualizarConservaLoNoEditableYActualizaLaCopiaEnLosViajesActivos() {
		existe(conductor());
		laActualizacionModifica(1);

		VehiculoDto respuesta = servicio.actualizar(usuarioId, new ActualizarVehiculoRequest("XYZ-9876", "SUV",
				"Kia", "Sportage", "Gris", 2023, 4, "11112222", null, true, null));

		assertThat(respuesta).isEqualTo(new VehiculoDto("XYZ-9876", "SUV", "Kia", "Sportage", "Gris", 2023, 4,
				"45678912", true, "ACTIVE", "/uploads/vehiculos/a.jpg", REGISTRO));

		ArgumentCaptor<Query> filtro = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> copia = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateMulti(filtro.capture(), copia.capture(), eq("viajes"));
		assertThat(filtro.getValue().getQueryObject()).containsEntry("conductor.id", usuarioId)
				.containsEntry("estado", new Document("$in", List.of("PUBLICADO", "EN_CURSO")));
		assertThat(copia.getValue().getUpdateObject().get("$set", Document.class))
				.containsEntry("vehiculo.marca", "Kia")
				.containsEntry("vehiculo.modelo", "Sportage")
				.containsEntry("vehiculo.color", "Gris")
				.containsEntry("vehiculo.placa", "XYZ-9876")
				.hasSize(4);
	}

	@Test
	void actualizarSoloLasPlazasNoTocaLosViajes() {
		existe(conductor());
		laActualizacionModifica(1);

		assertThat(servicio.actualizar(usuarioId, actualizacion("ABC-123", 2)).seats()).isEqualTo(2);

		verify(mongoTemplate, never()).updateMulti(any(Query.class), any(Update.class), any(String.class));
	}

	@Test
	void actualizarSinVehiculoLoRegistraYNoTocaLosViajes() {
		existe(pasajero().tipoDocumento(TipoDocumento.DNI).numeroDocumento("72345678").build());
		laActualizacionModifica(1);

		VehiculoDto respuesta = servicio.actualizar(usuarioId, actualizacion("abc123", 3));

		assertThat(respuesta.plate()).isEqualTo("ABC-123");
		assertThat(respuesta.ownerDni()).isEqualTo("72345678");
		assertThat(respuesta.isOwner()).isFalse();
		assertThat(respuesta.status()).isEqualTo("ACTIVE");
		assertThat(respuesta.registeredAt()).isNotNull();

		ArgumentCaptor<Query> filtro = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> cambios = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(filtro.capture(), cambios.capture(), eq(Usuario.class));
		assertThat(filtro.getValue().getQueryObject()).containsEntry("vehiculo", new Document("$exists", false));
		assertThat(cambios.getValue().getUpdateObject().get("$addToSet", Document.class))
				.containsEntry("roles", Rol.CONDUCTOR);
		verify(mongoTemplate, never()).updateMulti(any(Query.class), any(Update.class), any(String.class));
	}

	@Test
	void actualizarSinVehiculoUsaElDniEnviadoYExigeElPerfilCompleto() {
		existe(pasajero().build());
		laActualizacionModifica(1);
		assertThat(servicio.actualizar(usuarioId, new ActualizarVehiculoRequest("ABC-123", "SEDAN", "Toyota", "Yaris",
				"Blanco", 2021, 3, "45678912", true, true, null)).ownerDni()).isEqualTo("45678912");
		assertThat(servicio.actualizar(usuarioId, actualizacion("ABC-123", 3)).ownerDni()).isNull();

		existe(pasajero().estado(EstadoUsuario.PERFIL_PENDIENTE).build());
		falla(() -> servicio.actualizar(usuarioId, actualizacion("ABC-123", 3)), CodigoError.PROFILE_INCOMPLETE);
	}

	// ------------------------------------------------------- Reglas de estado

	@Test
	void registrarExigeElPerfilCompletoYUnSoloVehiculo() {
		existe(pasajero().estado(EstadoUsuario.PERFIL_PENDIENTE).build());
		falla(() -> servicio.registrar(usuarioId, registro(null)), CodigoError.PROFILE_INCOMPLETE);

		existe(conductor());
		falla(() -> servicio.registrar(usuarioId, registro(null)), CodigoError.VEHICLE_ALREADY_REGISTERED);

		// Otro registro del mismo usuario se adelantó entre la lectura y la escritura.
		existe(pasajero().build());
		laActualizacionModifica(0);
		falla(() -> servicio.registrar(usuarioId, registro(null)), CodigoError.VEHICLE_ALREADY_REGISTERED);
	}

	@Test
	void laPlacaDeOtroUsuarioSeRechaza() {
		when(usuarioRepository.existsByVehiculoPlacaAndIdNot("ABC-123", usuarioId)).thenReturn(true);
		existe(pasajero().build());
		falla(() -> servicio.registrar(usuarioId, registro(null)), CodigoError.PLATE_ALREADY_REGISTERED);
		existe(conductor());
		falla(() -> servicio.actualizar(usuarioId, actualizacion("ABC-123", 3)), CodigoError.PLATE_ALREADY_REGISTERED);
		verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Usuario.class));

		// Dos usuarios guardan la misma placa a la vez: responde el índice único.
		when(usuarioRepository.existsByVehiculoPlacaAndIdNot("ABC-123", usuarioId)).thenReturn(false);
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Usuario.class)))
				.thenThrow(new DuplicateKeyException("vehiculo.placa"));
		falla(() -> servicio.actualizar(usuarioId, actualizacion("ABC-123", 3)), CodigoError.PLATE_ALREADY_REGISTERED);
	}

	@Test
	void consultarSinVehiculoRespondeNotFound() {
		existe(pasajero().build());

		falla(() -> servicio.consultar(usuarioId), CodigoError.VEHICLE_NOT_FOUND);
	}

	@Test
	void laFotoDebeSerDelUsuarioYDeVehiculo() {
		existe(pasajero().build());
		ObjectId archivoId = new ObjectId();
		when(archivoRepository.findById(archivoId)).thenReturn(Optional.of(new Archivo(archivoId, usuarioId,
				PropositoArchivo.FOTO_PERFIL, "perfiles/a.jpg", "/uploads/perfiles/a.jpg", "image/jpeg", 1,
				Instant.now())));

		falla(() -> servicio.registrar(usuarioId, registro(archivoId.toHexString())),
				CodigoError.INVALID_FILE_REFERENCE);
	}
}
