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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Las solicitudes inválidas se rechazan antes del servicio con el cuerpo Error del contrato. */
class ValidacionSolicitudesTest {

	private final AuthService authService = mock(AuthService.class);
	private final RegistroService registroService = mock(RegistroService.class);
	private final CatalogoService catalogoService = mock(CatalogoService.class);
	private MockMvc mvc;

	@BeforeEach
	void configurar() {
		LocalValidatorFactoryBean validador = new LocalValidatorFactoryBean();
		validador.afterPropertiesSet();
		mvc = MockMvcBuilders
				.standaloneSetup(new AuthController(authService, registroService),
						new CatalogoController(catalogoService))
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
}
