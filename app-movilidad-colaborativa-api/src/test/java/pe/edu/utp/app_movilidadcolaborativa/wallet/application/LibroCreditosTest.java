package pe.edu.utp.app_movilidadcolaborativa.wallet.application;

import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import pe.edu.utp.app_movilidadcolaborativa.rides.application.Viajes;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Actor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva.ResumenViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.MovimientoCredito;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.TipoMovimiento;

import java.time.Instant;
import java.util.List;
import java.util.OptionalInt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Libro de créditos: saldo y movimiento juntos, retención, reembolso y liquidación (RN-39, RN-40), sin base de datos. */
class LibroCreditosTest {

	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final LibroCreditos libro = new LibroCreditos(mongoTemplate);
	private final ObjectId pasajeroId = new ObjectId();
	private final ObjectId conductorId = new ObjectId();
	private final ObjectId viajeId = new ObjectId();
	private final Instant ahora = Instant.parse("2026-11-21T19:06:00Z");

	private Reserva reserva(EstadoReserva estado) {
		return Reserva.builder().id(new ObjectId()).viajeId(viajeId)
				.pasajero(new ReferenciaNombre(pasajeroId, "Lucía R."))
				.viaje(new ResumenViaje("Campus UTP Trujillo", "Urb. El Golf", ahora, "Carlos M.", null))
				.plazas(2).totalCreditos(12).estado(estado).liquidada(false).build();
	}

	private void saldoTras(Integer saldo) {
		when(mongoTemplate.findAndModify(any(Query.class), any(Update.class), any(FindAndModifyOptions.class),
				eq(Usuario.class))).thenReturn(saldo == null ? null : Usuario.builder().saldoCreditos(saldo).build());
	}

	private void liquidarModifica(long documentos) {
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Reserva.class)))
				.thenReturn(UpdateResult.acknowledged(documentos, documentos, null));
	}

	private MovimientoCredito movimiento() {
		ArgumentCaptor<MovimientoCredito> insertado = ArgumentCaptor.forClass(MovimientoCredito.class);
		verify(mongoTemplate).insert(insertado.capture());
		return insertado.getValue();
	}

	@Test
	void retenerExigeSaldoYPasaElTotalARetenido() {
		saldoTras(26);

		assertThat(libro.retener(reserva(EstadoReserva.CONFIRMADA), ahora)).isEqualTo(OptionalInt.of(26));

		ArgumentCaptor<Query> condicion = ArgumentCaptor.forClass(Query.class);
		ArgumentCaptor<Update> cambio = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate).findAndModify(condicion.capture(), cambio.capture(), any(FindAndModifyOptions.class),
				eq(Usuario.class));
		assertThat(condicion.getValue().getQueryObject()).containsEntry("_id", pasajeroId)
				.containsEntry("saldo_creditos", new Document("$gte", 12));
		assertThat(cambio.getValue().getUpdateObject().get("$inc", Document.class))
				.containsEntry("saldo_creditos", -12).containsEntry("creditos_retenidos", 12);
		MovimientoCredito movimiento = movimiento();
		assertThat(movimiento.tipo()).isEqualTo(TipoMovimiento.RETENCION_RESERVA);
		assertThat(movimiento.monto()).isEqualTo(-12);
		assertThat(movimiento.saldoPosterior()).isEqualTo(26);
		assertThat(movimiento.descripcion()).isEqualTo("Campus UTP Trujillo → Urb. El Golf · 2 plazas");
	}

	@Test
	void sinSaldoNoSeRegistraNada() {
		saldoTras(null);
		assertThat(libro.retener(reserva(EstadoReserva.CONFIRMADA), ahora)).isEmpty();
		verify(mongoTemplate, never()).insert(any(MovimientoCredito.class));
	}

	@Test
	void reembolsarDevuelveLoRetenidoUnaSolaVez() {
		liquidarModifica(1);
		saldoTras(46);

		assertThat(libro.reembolsar(reserva(EstadoReserva.CANCELADA), Actor.CONDUCTOR, ahora)).isEqualTo(12);

		MovimientoCredito movimiento = movimiento();
		assertThat(movimiento.tipo()).isEqualTo(TipoMovimiento.REEMBOLSO);
		assertThat(movimiento.monto()).isEqualTo(12);
		assertThat(movimiento.descripcion())
				.isEqualTo("Cancelado por el conductor · Campus UTP Trujillo → Urb. El Golf");
	}

	@Test
	void unaReservaYaLiquidadaOAnteriorALaBilleteraNoSeReembolsa() {
		liquidarModifica(0);
		assertThat(libro.reembolsar(reserva(EstadoReserva.CANCELADA), Actor.PASAJERO, ahora)).isZero();
		verify(mongoTemplate, never()).findAndModify(any(Query.class), any(Update.class),
				any(FindAndModifyOptions.class), eq(Usuario.class));
	}

	@Test
	void liquidarPagaAlConductorCadaReservaCompletadaONoPresentada() {
		Viaje viaje = Viajes.publicado(viajeId, conductorId).build();
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class)))
				.thenReturn(List.of(reserva(EstadoReserva.COMPLETADA), reserva(EstadoReserva.NO_SE_PRESENTO)));
		liquidarModifica(1);
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Usuario.class)))
				.thenReturn(UpdateResult.acknowledged(1, 1L, null));
		saldoTras(120);

		assertThat(libro.liquidarViaje(viaje, ahora)).isEqualTo(24);

		// Al pasajero solo se le liberan los retenidos; al conductor se le abona con COBRO_VIAJE.
		ArgumentCaptor<Update> liberacion = ArgumentCaptor.forClass(Update.class);
		verify(mongoTemplate, times(2)).updateFirst(any(Query.class), liberacion.capture(), eq(Usuario.class));
		assertThat(liberacion.getValue().getUpdateObject().get("$inc", Document.class))
				.containsEntry("creditos_retenidos", -12);
		ArgumentCaptor<MovimientoCredito> cobros = ArgumentCaptor.forClass(MovimientoCredito.class);
		verify(mongoTemplate, times(2)).insert(cobros.capture());
		assertThat(cobros.getAllValues()).allSatisfy(cobro -> {
			assertThat(cobro.usuarioId()).isEqualTo(conductorId);
			assertThat(cobro.tipo()).isEqualTo(TipoMovimiento.COBRO_VIAJE);
			assertThat(cobro.monto()).isEqualTo(12);
			assertThat(cobro.descripcion()).isEqualTo("Lucía R. · Campus UTP Trujillo → Urb. El Golf");
		});
	}

	@Test
	void retenidosInconsistentesRevierteLaLiquidacion() {
		when(mongoTemplate.find(any(Query.class), eq(Reserva.class)))
				.thenReturn(List.of(reserva(EstadoReserva.COMPLETADA)));
		liquidarModifica(1);
		when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Usuario.class)))
				.thenReturn(UpdateResult.acknowledged(0, 0L, null));
		assertThatThrownBy(() -> libro.liquidarViaje(Viajes.publicado(viajeId, conductorId).build(), ahora))
				.isInstanceOf(IllegalStateException.class);
	}
}
