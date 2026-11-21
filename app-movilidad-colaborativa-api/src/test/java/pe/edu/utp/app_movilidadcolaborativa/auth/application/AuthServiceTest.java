package pe.edu.utp.app_movilidadcolaborativa.auth.application;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.LoginRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.LoginResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.OtpInfoDto;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.TokenDto;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.TokenUsuarioResponse;
import pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto.VerificarCodigoRequest;
import pe.edu.utp.app_movilidadcolaborativa.auth.infrastructure.security.JwtService;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.AlcanceToken;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Rol;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** OTP solo en el primer login de la cuenta (RN-35), sin base de datos. */
class AuthServiceTest {

	private static final String CORREO = "valeria.rodriguez@utp.edu.pe";
	private static final String CLAVE = "Clave#2026";

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
	private final OtpService otpService = mock(OtpService.class);
	private final JwtService jwtService = mock(JwtService.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final AuthService servicio = new AuthService(usuarioRepository, passwordEncoder, otpService, jwtService,
			mongoTemplate);

	private final ObjectId usuarioId = new ObjectId();

	@Test
	void primerLoginEnviaOtpYDevuelvePreAuth() {
		usuario(null);
		OtpInfoDto otp = new OtpInfoDto(300, 45, 3);
		when(otpService.emitir(any())).thenReturn(otp);
		when(jwtService.emitir(usuarioId, AlcanceToken.PRE_AUTH))
				.thenReturn(new TokenDto("pre", AlcanceToken.PRE_AUTH, 600));

		LoginResponse respuesta = servicio.iniciarSesion(new LoginRequest(CORREO, CLAVE));

		assertThat(respuesta.scope()).isEqualTo(AlcanceToken.PRE_AUTH);
		assertThat(respuesta.otp()).isEqualTo(otp);
		assertThat(respuesta.user()).isNull();
		// La conexión se registra recién al validar el OTP.
		verifyNoInteractions(mongoTemplate);
	}

	@Test
	void loginConConexionPreviaNoPideOtpYRegistraLaConexion() {
		usuario(Instant.parse("2026-11-01T10:00:00Z"));
		when(jwtService.emitir(usuarioId, AlcanceToken.SESSION))
				.thenReturn(new TokenDto("ses", AlcanceToken.SESSION, 28800));

		LoginResponse respuesta = servicio.iniciarSesion(new LoginRequest(CORREO, CLAVE));

		assertThat(respuesta.scope()).isEqualTo(AlcanceToken.SESSION);
		assertThat(respuesta.otp()).isNull();
		assertThat(respuesta.user().id()).isEqualTo(usuarioId.toHexString());
		verify(otpService, never()).emitir(any());
		assertThat(conexionRegistrada()).isInstanceOf(Instant.class);
	}

	@Test
	void verificarCodigoRegistraLaConexion() {
		usuario(null);
		when(jwtService.emitir(usuarioId, AlcanceToken.SESSION))
				.thenReturn(new TokenDto("ses", AlcanceToken.SESSION, 28800));

		TokenUsuarioResponse respuesta = servicio.verificarCodigo(usuarioId, new VerificarCodigoRequest("123456"));

		assertThat(respuesta.scope()).isEqualTo(AlcanceToken.SESSION);
		verify(otpService).verificar(usuarioId, "123456");
		assertThat(conexionRegistrada()).isInstanceOf(Instant.class);
	}

	@Test
	void codigoInvalidoNoRegistraLaConexion() {
		usuario(null);
		org.mockito.Mockito.doThrow(new ApiException(CodigoError.OTP_INVALID, "Código inválido."))
				.when(otpService).verificar(usuarioId, "000000");

		assertThatThrownBy(() -> servicio.verificarCodigo(usuarioId, new VerificarCodigoRequest("000000")))
				.isInstanceOf(ApiException.class);
		verifyNoInteractions(mongoTemplate);
	}

	@Test
	void cuentaBloqueadaNoEntraAunqueYaSeHayaConectado() {
		Usuario usuario = usuario(Instant.now());
		usuario.setEstado(EstadoUsuario.BLOQUEADO);

		assertThatThrownBy(() -> servicio.iniciarSesion(new LoginRequest(CORREO, CLAVE)))
				.isInstanceOf(ApiException.class)
				.extracting(error -> ((ApiException) error).getCodigo())
				.isEqualTo(CodigoError.ACCOUNT_BLOCKED);
		verifyNoInteractions(mongoTemplate, jwtService);
	}

	private Usuario usuario(Instant ultimaConexion) {
		Usuario usuario = Usuario.builder()
				.id(usuarioId)
				.correo(CORREO)
				.contrasenaHash("hash")
				.nombres("Valeria")
				.apellidos("Rodríguez")
				.roles(List.of(Rol.PASAJERO))
				.modoActivo(Rol.PASAJERO)
				.estado(EstadoUsuario.ACTIVO)
				.ultimaConexion(ultimaConexion)
				.build();
		when(usuarioRepository.findByCorreo(CORREO)).thenReturn(Optional.of(usuario));
		when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches(eq(CLAVE), anyString())).thenReturn(true);
		return usuario;
	}

	private Object conexionRegistrada() {
		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> cambio = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(consulta.capture(), cambio.capture(), eq(Usuario.class));
		assertThat(consulta.getValue().getQueryObject().get("_id")).isEqualTo(usuarioId);
		return ((Document) cambio.getValue().getUpdateObject().get("$set")).get("ultima_conexion");
	}
}
