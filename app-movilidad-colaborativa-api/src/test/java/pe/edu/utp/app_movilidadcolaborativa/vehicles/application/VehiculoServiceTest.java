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
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.AccesibilidadDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.VehiculoDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Accesibilidad;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Soat;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoDocumento;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.ActualizarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.RegistrarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.SoatRequest;

import java.time.Instant;
import java.time.LocalDate;
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
import static org.mockito.Mockito.when;

/** Camino feliz y reglas de estado del vehículo (RF-07, RF-08, RF-22), sin base de datos. */
class VehiculoServiceTest {

	private static final Instant REGISTRO = Instant.parse("2026-10-02T10:00:00Z");
	private static final AccesibilidadDto SIN_ACCESIBILIDAD = new AccesibilidadDto(false, false);
	private static final LocalDate HOY = Soat.fechaPeru(Instant.now());

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
						"45678912", true, EstadoVehiculo.ACTIVO, foto, REGISTRO, REGISTRO, null, null))
				.build();
	}

	private static SoatRequest soat(LocalDate inicio, LocalDate fin) {
		return new SoatRequest(" Rímac Seguros ", "2401-abc123", inicio, fin, null);
	}

	private static RegistrarVehiculoRequest sedan(AccesibilidadDto accesibilidad, SoatRequest soat) {
		return new RegistrarVehiculoRequest("ABC-123", "SEDAN", "Toyota", "Yaris", "Blanco", 2021, 3, "45678912",
				true, true, null, accesibilidad, soat);
	}

	private Vehiculo vehiculoGuardado() {
		ArgumentCaptor<Update> cambios = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(any(Query.class), cambios.capture(), eq(Usuario.class));
		return cambios.getValue().getUpdateObject().get("$set", Document.class).get("vehiculo", Vehiculo.class);
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
				null, true, archivoId, null, null);
	}

	private static ActualizarVehiculoRequest actualizacion(String placa, Integer plazas) {
		return new ActualizarVehiculoRequest(placa, "SEDAN", "Toyota", "Yaris", "Blanco", 2021, plazas, null, null,
				true, null, null, null);
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
				"Blanco", 2021, 3, "45678912", true, "ACTIVE", "/uploads/vehiculos/a.jpg", REGISTRO,
				SIN_ACCESIBILIDAD, null));
	}

	@Test
	void actualizarConservaLoNoEditableYActualizaLaCopiaEnLosViajesActivos() {
		existe(conductor());
		laActualizacionModifica(1);

		VehiculoDto respuesta = servicio.actualizar(usuarioId, new ActualizarVehiculoRequest("XYZ-9876", "SUV",
				"Kia", "Sportage", "Gris", 2023, 4, "11112222", null, true, null, null, null));

		assertThat(respuesta).isEqualTo(new VehiculoDto("XYZ-9876", "SUV", "Kia", "Sportage", "Gris", 2023, 4,
				"45678912", true, "ACTIVE", "/uploads/vehiculos/a.jpg", REGISTRO, SIN_ACCESIBILIDAD, null));

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
				.containsEntry("vehiculo.apto_movilidad_reducida", false)
				.containsEntry("vehiculo.soat_fecha_fin", null)
				.hasSize(6);
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
				"Blanco", 2021, 3, "45678912", true, true, null, null, null)).ownerDni()).isEqualTo("45678912");
		assertThat(servicio.actualizar(usuarioId, actualizacion("ABC-123", 3)).ownerDni()).isNull();

		existe(pasajero().estado(EstadoUsuario.PERFIL_PENDIENTE).build());
		falla(() -> servicio.actualizar(usuarioId, actualizacion("ABC-123", 3)), CodigoError.PROFILE_INCOMPLETE);
	}

	@Test
	void registrarGuardaLaAccesibilidadYElSoat() {
		existe(pasajero().build());
		laActualizacionModifica(1);

		VehiculoDto respuesta = servicio.registrar(usuarioId,
				sedan(new AccesibilidadDto(true, null), soat(HOY.minusDays(10), HOY.plusDays(355))));

		assertThat(respuesta.accessibility()).isEqualTo(new AccesibilidadDto(true, false));
		assertThat(respuesta.soat().insurer()).isEqualTo("Rímac Seguros");
		assertThat(respuesta.soat().policyNumber()).isEqualTo("2401-ABC123");
		assertThat(respuesta.soat().startDate()).isEqualTo(HOY.minusDays(10));
		assertThat(respuesta.soat().endDate()).isEqualTo(HOY.plusDays(355));
		assertThat(respuesta.soat().declaredAt()).isNotNull();

		Vehiculo guardado = vehiculoGuardado();
		assertThat(guardado.esApto()).isTrue();
		// Las fechas se guardan al inicio del día en hora de Perú.
		assertThat(guardado.soat().fechaFin()).isEqualTo(Soat.inicioDelDia(HOY.plusDays(355)));
	}

	@Test
	void actualizarSinAccesibilidadNiSoatConservaLosActualesYCopiaLaAccesibilidadEnLosViajes() {
		Soat soat = new Soat("Pacífico", "POL-123456", Soat.inicioDelDia(HOY.minusDays(1)),
				Soat.inicioDelDia(HOY.plusDays(300)), null, REGISTRO);
		existe(pasajero().vehiculo(new Vehiculo("ABC-123", TipoVehiculo.SEDAN, "Toyota", "Yaris", "Blanco", 2021, 3,
				"45678912", true, EstadoVehiculo.ACTIVO, foto, REGISTRO, REGISTRO, new Accesibilidad(true, true), soat))
				.build());
		laActualizacionModifica(1);

		VehiculoDto respuesta = servicio.actualizar(usuarioId, actualizacion("ABC-123", 3));

		assertThat(respuesta.accessibility()).isEqualTo(new AccesibilidadDto(true, true));
		assertThat(respuesta.soat().policyNumber()).isEqualTo("POL-123456");
		verify(mongoTemplate, never()).updateMulti(any(Query.class), any(Update.class), any(String.class));

		// Quitar la accesibilidad sí cambia la copia de los viajes activos.
		servicio.actualizar(usuarioId, new ActualizarVehiculoRequest("ABC-123", "SEDAN", "Toyota", "Yaris", "Blanco",
				2021, 3, null, null, true, null, new AccesibilidadDto(false, false), null));
		ArgumentCaptor<Update> copia = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateMulti(any(Query.class), copia.capture(), eq("viajes"));
		assertThat(copia.getValue().getUpdateObject().get("$set", Document.class))
				.containsEntry("vehiculo.apto_movilidad_reducida", false)
				.containsEntry("vehiculo.soat_fecha_fin", Soat.inicioDelDia(HOY.plusDays(300)));
	}

	// ------------------------------------------------------- Reglas de estado

	@Test
	void unaMotoNoPuedeMarcarseComoAccesible() {
		existe(pasajero().build());
		RegistrarVehiculoRequest moto = new RegistrarVehiculoRequest("ABC-123", "MOTORCYCLE", "Honda", "CB190",
				"Rojo", 2022, 1, "45678912", null, true, null, new AccesibilidadDto(false, true), null);

		assertThat(catchThrowableOfType(ValidacionException.class, () -> servicio.registrar(usuarioId, moto))
				.getErrores()).singleElement().satisfies(error -> assertThat(error.field()).isEqualTo("accessibility"));
		verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Usuario.class));
	}

	@Test
	void elSoatDebeEstarVigenteHoyYDurarComoMaximo366Dias() {
		existe(pasajero().build());

		falla(() -> servicio.registrar(usuarioId, sedan(null, soat(HOY.minusDays(366), HOY.minusDays(1)))),
				CodigoError.SOAT_NOT_VALID);
		falla(() -> servicio.registrar(usuarioId, sedan(null, soat(HOY.plusDays(1), HOY.plusDays(300)))),
				CodigoError.SOAT_NOT_VALID);
		assertThat(catchThrowableOfType(ValidacionException.class,
				() -> servicio.registrar(usuarioId, sedan(null, soat(HOY, HOY.plusDays(366))))).getMessage())
				.isEqualTo("La vigencia del SOAT no puede superar los 366 días");
		assertThat(catchThrowableOfType(ValidacionException.class,
				() -> servicio.registrar(usuarioId, sedan(null, soat(HOY, HOY.minusDays(1))))).getMessage())
				.isEqualTo("La fecha de fin debe ser posterior a la de inicio");
		verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Usuario.class));

		// Vigente hoy y 366 días exactos: se acepta.
		laActualizacionModifica(1);
		assertThat(servicio.registrar(usuarioId, sedan(null, soat(HOY, HOY.plusDays(365)))).soat()).isNotNull();
	}

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
