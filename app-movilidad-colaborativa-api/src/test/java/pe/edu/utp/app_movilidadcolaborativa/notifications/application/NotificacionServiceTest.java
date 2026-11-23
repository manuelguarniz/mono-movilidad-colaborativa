package pe.edu.utp.app_movilidadcolaborativa.notifications.application;

import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.BandejaDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.Notificacion;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.TipoNotificacion;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Bandeja y contador de RF-13; cada consulta va filtrada por el usuario del token (RN-34). */
class NotificacionServiceTest {

	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final NotificacionService servicio = new NotificacionService(mongoTemplate);
	private final ObjectId usuarioId = new ObjectId();

	@Test
	void laBandejaTraeLasCincuentaMasRecientesDelUsuarioYElContador() {
		Notificacion notificacion = Notificacion.builder().id(new ObjectId()).usuarioId(usuarioId)
				.tipo(TipoNotificacion.VIAJE_INICIADO).titulo("Viaje iniciado").mensaje("Tu viaje a X inició.")
				.leida(false).fechaCreacion(Instant.now()).build();
		when(mongoTemplate.find(any(Query.class), eq(Notificacion.class))).thenReturn(List.of(notificacion));
		when(mongoTemplate.count(any(Query.class), eq(Notificacion.class))).thenReturn(1L);

		BandejaDto bandeja = servicio.bandeja(usuarioId);

		assertThat(bandeja.unreadCount()).isEqualTo(1);
		assertThat(bandeja.data()).singleElement().satisfies(dto -> {
			assertThat(dto.type()).isEqualTo("VIAJE_INICIADO");
			assertThat(dto.read()).isFalse();
			assertThat(dto.rideId()).isNull();
		});
		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(consulta.capture(), eq(Notificacion.class));
		assertThat(consulta.getValue().getQueryObject()).containsEntry("usuario_id", usuarioId);
		assertThat(consulta.getValue().getLimit()).isEqualTo(50);
		assertThat(consulta.getValue().getSortObject()).containsEntry("fecha_creacion", -1);
	}

	@Test
	void unaNotificacionAjenaRespondeComoInexistente() {
		ObjectId ajena = new ObjectId();
		when(mongoTemplate.exists(any(Query.class), eq(Notificacion.class))).thenReturn(false);

		assertThatThrownBy(() -> servicio.marcarLeida(usuarioId, ajena)).isInstanceOfSatisfying(ApiException.class,
				ex -> {
					assertThat(ex.getCodigo()).isEqualTo(CodigoError.NOTIFICATION_NOT_FOUND);
					assertThat(ex.getMessage()).isEqualTo("Notificación no encontrada");
				});
		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).exists(consulta.capture(), eq(Notificacion.class));
		assertThat(consulta.getValue().getQueryObject()).containsEntry("_id", ajena).containsEntry("usuario_id", usuarioId);
		verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(Notificacion.class));
	}

	@Test
	void marcarLeidaDevuelveElContador() {
		ObjectId propia = new ObjectId();
		when(mongoTemplate.exists(any(Query.class), eq(Notificacion.class))).thenReturn(true);
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Notificacion.class)))
				.thenReturn(UpdateResult.acknowledged(1, 1L, null));
		when(mongoTemplate.count(any(Query.class), eq(Notificacion.class))).thenReturn(2L);

		assertThat(servicio.marcarLeida(usuarioId, propia)).isEqualTo(2);
		ArgumentCaptor<Update> cambio = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).updateFirst(any(Query.class), cambio.capture(), eq(Notificacion.class));
		assertThat(cambio.getValue().getUpdateObject().get("$set", Document.class)).containsEntry("leida", true);
	}

	@Test
	void marcarTodasSoloTocaLasDelUsuario() {
		assertThat(servicio.marcarTodas(usuarioId)).isZero();
		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).updateMulti(consulta.capture(), any(Update.class), eq(Notificacion.class));
		assertThat(consulta.getValue().getQueryObject()).containsEntry("usuario_id", usuarioId)
				.containsEntry("leida", false);
	}
}
