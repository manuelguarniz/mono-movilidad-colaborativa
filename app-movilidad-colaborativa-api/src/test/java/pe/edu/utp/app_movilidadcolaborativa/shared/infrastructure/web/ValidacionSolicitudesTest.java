package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.web;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import pe.edu.utp.app_movilidadcolaborativa.auth.application.AuthService;
import pe.edu.utp.app_movilidadcolaborativa.auth.application.RegistroService;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.LoginRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.web.AuthController;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.application.CatalogoService;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.web.CatalogoController;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.ReservaService;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.ViajeService;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.FiltroViajesRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.LugarDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.PublicarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeDetalleDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.web.ViajeController;
import pe.edu.utp.app_movilidadcolaborativa.users.application.PerfilService;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.ActualizarPerfilRequest;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.web.UsuarioController;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.application.VehiculoService;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.ActualizarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.domain.dto.RegistrarVehiculoRequest;
import pe.edu.utp.app_movilidadcolaborativa.vehicles.infrastructure.web.VehiculoController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Las solicitudes inválidas se rechazan antes del servicio con el cuerpo Error del contrato. */
class ValidacionSolicitudesTest {

	private final AuthService authService = mock(AuthService.class);
	private final RegistroService registroService = mock(RegistroService.class);
	private final CatalogoService catalogoService = mock(CatalogoService.class);
	private final PerfilService perfilService = mock(PerfilService.class);
	private final VehiculoService vehiculoService = mock(VehiculoService.class);
	private final ViajeService viajeService = mock(ViajeService.class);
	private final ReservaService reservaService = mock(ReservaService.class);
	private MockMvc mvc;

	@BeforeEach
	void configurar() {
		LocalValidatorFactoryBean validador = new LocalValidatorFactoryBean();
		validador.afterPropertiesSet();
		mvc = MockMvcBuilders
				.standaloneSetup(new AuthController(authService, registroService),
						new CatalogoController(catalogoService), new UsuarioController(perfilService),
							new VehiculoController(vehiculoService),
							new ViajeController(viajeService, reservaService))
				.setControllerAdvice(new ManejadorErrores())
				.setValidator(validador)
				.setCustomArgumentResolvers(jwtDelUsuario())
				.build();
	}

	// Sin el filtro de seguridad, el @AuthenticationPrincipal se resuelve con un JWT fijo.
	private static HandlerMethodArgumentResolver jwtDelUsuario() {
		Jwt jwt = Jwt.withTokenValue("token").header("alg", "HS256").subject(new ObjectId().toHexString()).build();
		return new HandlerMethodArgumentResolver() {
			@Override
			public boolean supportsParameter(MethodParameter parametro) {
				return parametro.getParameterType() == Jwt.class;
			}

			@Override
			public Object resolveArgument(MethodParameter parametro, ModelAndViewContainer contenedor,
					NativeWebRequest solicitud, WebDataBinderFactory fabrica) {
				return jwt;
			}
		};
	}

	@Test
	void registroInvalidoDevuelveUnErrorPorCampo() throws Exception {
		mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"ana@gmail.com\",\"password\":\"corta\",\"acceptedTerms\":false}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.message").value("Revisa los datos enviados"))
				.andExpect(jsonPath("$.errors", hasSize(3)))
				.andExpect(jsonPath("$.errors[0].field").value("acceptedTerms"))
				.andExpect(jsonPath("$.errors[0].message").value("Debes aceptar los términos y condiciones"))
				.andExpect(jsonPath("$.errors[1].field").value("email"))
				.andExpect(jsonPath("$.errors[1].message").value("El correo debe ser del dominio utp.edu.pe"))
				.andExpect(jsonPath("$.errors[2].field").value("password"));
		verifyNoInteractions(registroService);
	}

	@Test
	void registroVacioDevuelveSoloElErrorDeObligatorio() throws Exception {
		mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"  \"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(3)))
				.andExpect(jsonPath("$.errors[1].field").value("email"))
				.andExpect(jsonPath("$.errors[1].message").value("El correo es obligatorio"));
	}

	@Test
	void loginNormalizaElCorreoAntesDeValidar() throws Exception {
		mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"  Ana@UTP.edu.pe \",\"password\":\"x\"}"))
				.andExpect(status().isOk());
		ArgumentCaptor<LoginRequest> solicitud = ArgumentCaptor.forClass(LoginRequest.class);
		verify(authService).iniciarSesion(solicitud.capture());
		assertThat(solicitud.getValue().email()).isEqualTo("ana@utp.edu.pe");
	}

	@Test
	void perfilInvalidoDevuelveUnErrorPorCampo() throws Exception {
		mvc.perform(post("/auth/complete-profile").contentType(MediaType.APPLICATION_JSON)
						.content("{\"firstName\":\" 123 \",\"departmentId\":\"abc\",\"photoFileId\":\"zzz\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(6)))
				.andExpect(jsonPath("$.errors[?(@.field=='firstName')].message")
						.value("Los nombres deben tener al menos una letra y como máximo 60 caracteres"))
				.andExpect(jsonPath("$.errors[?(@.field=='lastName')].message").value("Los apellidos son obligatorios"))
				.andExpect(jsonPath("$.errors[?(@.field=='departmentId')].message").value("El departamento no es válido"))
				.andExpect(jsonPath("$.errors[?(@.field=='districtId')].message").value("El distrito es obligatorio"))
				.andExpect(jsonPath("$.errors[?(@.field=='campusId')].message").value("La sede es obligatoria"))
				.andExpect(jsonPath("$.errors[?(@.field=='photoFileId')].message").value("La foto de perfil no es válida"));
		verifyNoInteractions(registroService);
	}

	@Test
	void codigoOtpDebeTenerSeisDigitos() throws Exception {
		for (String cuerpo : new String[] {"{}", "{\"code\":\"12a456\"}", "{\"code\":\"1234567\"}"}) {
			mvc.perform(post("/auth/verify-code").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors", hasSize(1)))
					.andExpect(jsonPath("$.errors[0].field").value("code"))
					.andExpect(jsonPath("$.errors[0].message").value("El código debe tener 6 dígitos"));
		}
		verifyNoInteractions(authService);
	}

	@Test
	void catalogoExigeUnIdentificadorValido() throws Exception {
		mvc.perform(get("/catalogs/districts"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Revisa los datos enviados"))
				.andExpect(jsonPath("$.errors[0].field").value("departmentId"))
				.andExpect(jsonPath("$.errors[0].message").value("El parámetro departmentId es obligatorio"));
		mvc.perform(get("/catalogs/campuses").param("districtId", "abc"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.errors[0].field").value("districtId"))
				.andExpect(jsonPath("$.errors[0].message").value("El parámetro districtId no es válido"));
		verifyNoInteractions(catalogoService);

		mvc.perform(get("/catalogs/districts").param("departmentId", "64b7f0c2a1b2c3d4e5f60718"))
				.andExpect(status().isOk());
		verify(catalogoService).listarDistritos(any(ObjectId.class));
	}

	@Test
	void actualizarPerfilInvalidoDevuelveUnErrorPorCampo() throws Exception {
		mvc.perform(put("/users/me").contentType(MediaType.APPLICATION_JSON)
						.content("{\"firstName\":\" \",\"lastName\":\"123\",\"phone\":\"987654321\","
								+ "\"activeMode\":\"ADMIN\",\"photoFileId\":\"zzz\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.errors", hasSize(5)))
				.andExpect(jsonPath("$.errors[?(@.field=='firstName')].message").value("Los nombres son obligatorios"))
				.andExpect(jsonPath("$.errors[?(@.field=='lastName')].message")
						.value("Los apellidos deben tener al menos una letra y como máximo 60 caracteres"))
				.andExpect(jsonPath("$.errors[?(@.field=='phone')].message")
						.value("El teléfono debe tener el formato +51 seguido de 9 dígitos"))
				.andExpect(jsonPath("$.errors[?(@.field=='activeMode')].message").value("La modalidad no es válida"))
				.andExpect(jsonPath("$.errors[?(@.field=='photoFileId')].message").value("La foto de perfil no es válida"));

		mvc.perform(put("/users/me").contentType(MediaType.APPLICATION_JSON)
						.content("{\"firstName\":\"Ana\",\"lastName\":\"Torres\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(2)))
				.andExpect(jsonPath("$.errors[0].field").value("activeMode"))
				.andExpect(jsonPath("$.errors[0].message").value("La modalidad es obligatoria"))
				.andExpect(jsonPath("$.errors[1].field").value("phone"))
				.andExpect(jsonPath("$.errors[1].message").value("El teléfono es obligatorio"));
		verifyNoInteractions(perfilService);
	}

	@Test
	void actualizarPerfilIgnoraElCorreoYNormalizaLosDatos() throws Exception {
		mvc.perform(put("/users/me").contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"otro@utp.edu.pe\",\"firstName\":\" Ana \",\"lastName\":\"Torres\","
								+ "\"documentType\":\"ce\",\"documentNumber\":\" ab123456 \","
								+ "\"phone\":\"+51987654321\",\"activeMode\":\"PASSENGER\"}"))
				.andExpect(status().isOk());
		ArgumentCaptor<ActualizarPerfilRequest> solicitud = ArgumentCaptor.forClass(ActualizarPerfilRequest.class);
		verify(perfilService).actualizar(any(ObjectId.class), solicitud.capture());
		assertThat(solicitud.getValue()).isEqualTo(new ActualizarPerfilRequest(null, "Ana", "Torres", "CE",
				"AB123456", "+51987654321", "PASSENGER"));
	}

	@Test
	void perfilDevuelveLosCamposVaciosComoNullYLaFechaEnIso() throws Exception {
		Usuario usuario = Usuario.builder().id(new ObjectId()).correo("ana.torres@utp.edu.pe")
				.estado(EstadoUsuario.ACTIVO).fechaCreacion(Instant.parse("2026-10-01T15:04:00Z")).build();
		when(perfilService.consultar(any(ObjectId.class))).thenReturn(PerfilUsuarioDto.desde(usuario));

		mvc.perform(get("/users/me"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("ana.torres@utp.edu.pe"))
				.andExpect(jsonPath("$.phone").value((Object) null))
				.andExpect(jsonPath("$.vehicle").value((Object) null))
				.andExpect(jsonPath("$.homeAddress").value((Object) null))
				.andExpect(jsonPath("$.stats.trips").value(0))
				.andExpect(jsonPath("$.createdAt").value("2026-10-01T15:04:00Z"))
				.andExpect(jsonPath("$.contrasenaHash").doesNotExist());
	}

	@Test
	void registrarVehiculoValidoRespondeCreatedConLaPlacaNormalizada() throws Exception {
		mvc.perform(post("/vehicles").contentType(MediaType.APPLICATION_JSON)
						.content("{\"plate\":\" abc123 \",\"type\":\"SEDAN\",\"brand\":\" Toyota \",\"model\":\"Yaris\","
								+ "\"color\":\"Blanco\",\"year\":2021,\"seats\":3,\"ownerDni\":\"45678912\","
								+ "\"acceptedTerms\":true}"))
				.andExpect(status().isCreated());
		ArgumentCaptor<RegistrarVehiculoRequest> solicitud = ArgumentCaptor.forClass(RegistrarVehiculoRequest.class);
		verify(vehiculoService).registrar(any(ObjectId.class), solicitud.capture());
		assertThat(solicitud.getValue()).isEqualTo(new RegistrarVehiculoRequest("ABC-123", "SEDAN", "Toyota", "Yaris",
				"Blanco", 2021, 3, "45678912", null, true, null));
	}

	@Test
	void actualizarVehiculoValidoRespondeOk() throws Exception {
		mvc.perform(put("/vehicles/me").contentType(MediaType.APPLICATION_JSON)
						.content("{\"plate\":\"B1C-4567\",\"type\":\"MOTORCYCLE\",\"brand\":\"Honda\",\"model\":\"CB190\","
								+ "\"color\":\"Rojo\",\"year\":2000,\"seats\":1,\"isOwner\":false,\"acceptedTerms\":true}"))
				.andExpect(status().isOk());
		verify(vehiculoService).actualizar(any(ObjectId.class), any(ActualizarVehiculoRequest.class));
	}

	@Test
	void vehiculoInvalidoDevuelveUnErrorPorCampo() throws Exception {
		mvc.perform(post("/vehicles").contentType(MediaType.APPLICATION_JSON)
						.content("{\"plate\":\"AB-12\",\"type\":\"BUS\",\"brand\":\" \",\"year\":1999,\"seats\":11,"
								+ "\"ownerDni\":\"1234\",\"acceptedTerms\":false,\"photoFileId\":\"zzz\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.errors", hasSize(10)))
				.andExpect(jsonPath("$.errors[?(@.field=='plate')].message").value("La placa debe tener el formato ABC-123"))
				.andExpect(jsonPath("$.errors[?(@.field=='type')].message").value("El tipo de vehículo no es válido"))
				.andExpect(jsonPath("$.errors[?(@.field=='brand')].message").value("La marca es obligatoria"))
				.andExpect(jsonPath("$.errors[?(@.field=='model')].message").value("El modelo es obligatorio"))
				.andExpect(jsonPath("$.errors[?(@.field=='color')].message").value("El color es obligatorio"))
				.andExpect(jsonPath("$.errors[?(@.field=='year')].message")
						.value("El año de fabricación debe estar entre 2000 y el año actual"))
				.andExpect(jsonPath("$.errors[?(@.field=='seats')].message").value("Las plazas deben estar entre 1 y 10"))
				.andExpect(jsonPath("$.errors[?(@.field=='ownerDni')].message").value("El DNI debe tener 8 dígitos"))
				.andExpect(jsonPath("$.errors[?(@.field=='acceptedTerms')].message")
						.value("Debes aceptar los términos y condiciones"))
				.andExpect(jsonPath("$.errors[?(@.field=='photoFileId')].message")
						.value("La foto del vehículo no es válida"));

		mvc.perform(put("/vehicles/me").contentType(MediaType.APPLICATION_JSON).content("{\"year\":2999}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasSize(8)))
				.andExpect(jsonPath("$.errors[?(@.field=='plate')].message").value("La placa es obligatoria"))
				.andExpect(jsonPath("$.errors[?(@.field=='seats')].message").value("Las plazas son obligatorias"))
				.andExpect(jsonPath("$.errors[?(@.field=='year')].message")
						.value("El año de fabricación debe estar entre 2000 y el año actual"));
		verifyNoInteractions(vehiculoService);
	}

	// Mañana a la hora indicada de Perú: siempre es una salida futura.
	private static Instant manana(int hora) {
		return LocalDate.now(ReglasViaje.ZONA_PERU).plusDays(1).atTime(hora, 30).atZone(ReglasViaje.ZONA_PERU)
				.toInstant();
	}

	@Test
	void publicarViajeValidoRespondeCreatedConLaRutaDelViaje() throws Exception {
		Instant salida = manana(13);
		LugarDto origen = new LugarDto("UTP Sede Trujillo", null, new LugarDto.PuntoDto(-8.0975, -79.0353));
		LugarDto destino = new LugarDto("Huaca del Dragón", "La Esperanza", new LugarDto.PuntoDto(-8.0716, -79.0412));
		when(viajeService.publicar(any(ObjectId.class), any(PublicarViajeRequest.class)))
				.thenReturn(new ViajeDetalleDto("6705a1f0c3d4e5f600000501", "PUBLISHED", "TO_HOME", salida, 5, 3, 3, 2.9,
						5, null, null, List.of(), origen, destino, List.of(), salida));

		mvc.perform(post("/rides").contentType(MediaType.APPLICATION_JSON)
						.content("{\"direction\":\"TO_HOME\",\"departureTime\":\"" + salida + "\","
								+ "\"origin\":{\"label\":\" UTP Sede Trujillo \",\"address\":\" \","
								+ "\"location\":{\"lat\":-8.0975,\"lng\":-79.0353}},"
								+ "\"destination\":{\"label\":\"Huaca del Dragón\",\"address\":\"La Esperanza\","
								+ "\"location\":{\"lat\":-8.0716,\"lng\":-79.0412}},"
								+ "\"pricePerSeat\":5,\"seats\":3}"))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/rides/6705a1f0c3d4e5f600000501"))
				.andExpect(jsonPath("$.status").value("PUBLISHED"))
				.andExpect(jsonPath("$.origin.location.lat").value(-8.0975));
		verify(viajeService).publicar(any(ObjectId.class),
				eq(new PublicarViajeRequest("TO_HOME", salida, origen, destino, List.of(), 5, 3, List.of())));
	}

	@Test
	void viajeInvalidoDevuelveUnErrorPorCampo() throws Exception {
		mvc.perform(post("/rides").contentType(MediaType.APPLICATION_JSON)
						.content("{\"direction\":\"NORTE\",\"departureTime\":\"" + manana(3) + "\","
								+ "\"origin\":{\"label\":\" \",\"location\":{\"lat\":-91,\"lng\":-79.0353}},"
								+ "\"stops\":[{\"label\":\"Óvalo Papal\"}],"
								+ "\"pricePerSeat\":11,\"seats\":0,\"conditions\":[\" \"]}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.errors", hasSize(9)))
				.andExpect(jsonPath("$.errors[?(@.field=='direction')].message").value("El sentido del viaje no es válido"))
				.andExpect(jsonPath("$.errors[?(@.field=='departureTime')].message")
						.value("La hora de salida debe ser futura y estar entre las 6:00 y las 23:00"))
				.andExpect(jsonPath("$.errors[?(@.field=='origin.label')].message")
						.value("El nombre del lugar es obligatorio"))
				.andExpect(jsonPath("$.errors[?(@.field=='origin.location.lat')].message")
						.value("La latitud debe estar entre -90 y 90"))
				.andExpect(jsonPath("$.errors[?(@.field=='destination')].message").value("El destino es obligatorio"))
				.andExpect(jsonPath("$.errors[?(@.field=='stops[0].location')].message")
						.value("La ubicación es obligatoria"))
				.andExpect(jsonPath("$.errors[?(@.field=='pricePerSeat')].message")
						.value("El precio por plaza debe estar entre 1 y 10"))
				.andExpect(jsonPath("$.errors[?(@.field=='seats')].message").value("Debes ofrecer al menos 1 plaza"))
				.andExpect(jsonPath("$.errors[?(@.field=='conditions[0]')].message")
						.value("Cada condición debe tener entre 1 y 120 caracteres"));
		verifyNoInteractions(viajeService);
	}

	@Test
	void listarViajesRecibeLosFiltrosYRechazaLosInvalidos() throws Exception {
		mvc.perform(get("/rides").param("campusId", "64b7f0c2a1b2c3d4e5f60718").param("destination", " Huaca ")
						.param("time", "14:15").param("passengers", "2"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)));
		verify(viajeService).listar(any(ObjectId.class),
				eq(new FiltroViajesRequest("64b7f0c2a1b2c3d4e5f60718", "Huaca", "14:15", "2")));
		mvc.perform(get("/rides")).andExpect(status().isOk());
		verify(viajeService).listar(any(ObjectId.class), eq(new FiltroViajesRequest(null, null, null, null)));

		mvc.perform(get("/rides").param("campusId", "abc").param("time", "25:00").param("passengers", "0"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
				.andExpect(jsonPath("$.errors", hasSize(3)))
				.andExpect(jsonPath("$.errors[0].field").value("campusId"))
				.andExpect(jsonPath("$.errors[0].message").value("El parámetro campusId no es válido"))
				.andExpect(jsonPath("$.errors[1].field").value("passengers"))
				.andExpect(jsonPath("$.errors[1].message").value("El número de pasajeros debe ser al menos 1"))
				.andExpect(jsonPath("$.errors[2].field").value("time"))
				.andExpect(jsonPath("$.errors[2].message").value("La hora debe tener el formato HH:mm"));
	}

	@Test
	void reservarSinCuerpoReservaUnaPlaza() throws Exception {
		mvc.perform(post("/rides/6705a1f0c3d4e5f600000501/reserve"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Reserva confirmada"));
		verify(reservaService).reservar(any(ObjectId.class), eq(new ObjectId("6705a1f0c3d4e5f600000501")), eq(1));

		mvc.perform(post("/rides/6705a1f0c3d4e5f600000501/reserve").contentType(MediaType.APPLICATION_JSON)
						.content("{\"seats\":2}"))
				.andExpect(status().isCreated());
		verify(reservaService).reservar(any(ObjectId.class), any(ObjectId.class), eq(2));
	}

	@Test
	void reservaYDetalleRechazanLosDatosInvalidos() throws Exception {
		mvc.perform(post("/rides/6705a1f0c3d4e5f600000501/reserve").contentType(MediaType.APPLICATION_JSON)
						.content("{\"seats\":0}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[0].field").value("seats"))
				.andExpect(jsonPath("$.errors[0].message").value("Debes reservar al menos 1 plaza"));
		mvc.perform(get("/rides/abc"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors[0].field").value("rideId"))
				.andExpect(jsonPath("$.errors[0].message").value("El parámetro rideId no es válido"));
		verifyNoInteractions(viajeService, reservaService);
	}
}
