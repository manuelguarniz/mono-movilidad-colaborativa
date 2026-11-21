package pe.edu.utp.app_movilidadcolaborativa.wallet.application;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Actor;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoReserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.MovimientoCredito;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.TipoMovimiento;

import java.time.Instant;
import java.util.List;
import java.util.OptionalInt;

/**
 * Libro de créditos (README, sección 5.1, y RNF-17). Cada cambio de saldo de usuarios va con su movimiento en
 * movimientos_creditos. Los métodos no abren transacción: se llaman dentro de la del caso de uso, para que el saldo,
 * el movimiento y el cambio de estado que los origina se confirmen o se descarten juntos.
 */
@Service
@RequiredArgsConstructor
public class LibroCreditos {

	private final MongoTemplate mongoTemplate;

	/** Datos de un movimiento. monto lleva el signo; deltaRetenidos es lo que cambia creditos_retenidos. */
	@Builder
	public record Asiento(ObjectId usuarioId, TipoMovimiento tipo, int monto, int deltaRetenidos, String descripcion,
			ObjectId pagoId, ObjectId reservaId, ObjectId viajeId, ObjectId retiroId, Instant fecha) {
	}

	/**
	 * Aplica el asiento si el saldo y los retenidos alcanzan (nunca quedan negativos, RN-39) y devuelve el saldo
	 * posterior. Si no alcanzan, no cambia nada y devuelve vacío.
	 */
	public OptionalInt registrar(Asiento asiento) {
		Criteria condicion = Criteria.where("_id").is(asiento.usuarioId());
		if (asiento.monto() < 0) {
			condicion.and("saldo_creditos").gte(-asiento.monto());
		}
		if (asiento.deltaRetenidos() < 0) {
			condicion.and("creditos_retenidos").gte(-asiento.deltaRetenidos());
		}
		Update cambio = new Update().set("fecha_actualizacion", asiento.fecha());
		// $inc sobre un campo que falta lo crea: las cuentas anteriores a la billetera empiezan en 0.
		cambio.inc("saldo_creditos", asiento.monto());
		if (asiento.deltaRetenidos() != 0) {
			cambio.inc("creditos_retenidos", asiento.deltaRetenidos());
		}
		Usuario actualizado = mongoTemplate.findAndModify(Query.query(condicion), cambio,
				FindAndModifyOptions.options().returnNew(true), Usuario.class);
		if (actualizado == null) {
			return OptionalInt.empty();
		}
		int saldo = valor(actualizado.getSaldoCreditos());
		mongoTemplate.insert(MovimientoCredito.builder()
				.id(new ObjectId())
				.usuarioId(asiento.usuarioId())
				.tipo(asiento.tipo())
				.monto(asiento.monto())
				.saldoPosterior(saldo)
				.descripcion(asiento.descripcion())
				.pagoId(asiento.pagoId())
				.reservaId(asiento.reservaId())
				.viajeId(asiento.viajeId())
				.retiroId(asiento.retiroId())
				.fechaCreacion(asiento.fecha())
				.build());
		return OptionalInt.of(saldo);
	}

	/** RN-39: pasa el total de la reserva de disponible a retenido. Vacío si el saldo no alcanza. */
	public OptionalInt retener(Reserva reserva, Instant fecha) {
		return registrar(Asiento.builder()
				.usuarioId(reserva.pasajero().id())
				.tipo(TipoMovimiento.RETENCION_RESERVA)
				.monto(-reserva.totalCreditos())
				.deltaRetenidos(reserva.totalCreditos())
				.descripcion("%s → %s · %d %s".formatted(reserva.viaje().origen(), reserva.viaje().destino(),
						reserva.plazas(), reserva.plazas() == 1 ? "plaza" : "plazas"))
				.reservaId(reserva.id())
				.viajeId(reserva.viajeId())
				.fecha(fecha)
				.build());
	}

	/**
	 * RN-40: devuelve el 100 % de lo retenido de una reserva cancelada. Devuelve los créditos reembolsados: 0 si la
	 * reserva es anterior a la billetera o ya estaba liquidada.
	 */
	public int reembolsar(Reserva reserva, Actor canceladaPor, Instant fecha) {
		if (!marcarLiquidada(reserva, fecha)) {
			return 0;
		}
		String motivo = switch (canceladaPor) {
			case PASAJERO -> "Cancelada por ti";
			case CONDUCTOR -> "Cancelado por el conductor";
			case SISTEMA -> "Cancelado: el viaje no se inició";
		};
		Asiento asiento = Asiento.builder()
				.usuarioId(reserva.pasajero().id())
				.tipo(TipoMovimiento.REEMBOLSO)
				.monto(reserva.totalCreditos())
				.deltaRetenidos(-reserva.totalCreditos())
				.descripcion("%s · %s → %s".formatted(motivo, reserva.viaje().origen(), reserva.viaje().destino()))
				.reservaId(reserva.id())
				.viajeId(reserva.viajeId())
				.fecha(fecha)
				.build();
		exigir(registrar(asiento), reserva);
		return reserva.totalCreditos();
	}

	/**
	 * RN-40: al cerrar el viaje, lo retenido de cada reserva COMPLETADA o NO_SE_PRESENTO se paga al conductor
	 * (COBRO_VIAJE) y sale de los retenidos del pasajero, sin movimiento para él. Devuelve el total cobrado.
	 */
	public int liquidarViaje(Viaje viaje, Instant fecha) {
		List<Reserva> reservas = mongoTemplate.find(Query.query(Criteria.where("viaje_id").is(viaje.id())
				.and("estado").in(EstadoReserva.COMPLETADA, EstadoReserva.NO_SE_PRESENTO)
				.and("liquidada").is(false)), Reserva.class);
		int cobrado = 0;
		for (Reserva reserva : reservas) {
			if (!marcarLiquidada(reserva, fecha)) {
				continue;
			}
			int total = reserva.totalCreditos();
			Query pasajero = Query.query(Criteria.where("_id").is(reserva.pasajero().id())
					.and("creditos_retenidos").gte(total));
			if (mongoTemplate.updateFirst(pasajero, new Update().inc("creditos_retenidos", -total)
					.set("fecha_actualizacion", fecha), Usuario.class).getModifiedCount() == 0) {
				throw new IllegalStateException("Retenidos insuficientes para liquidar la reserva " + reserva.id());
			}
			exigir(registrar(Asiento.builder()
					.usuarioId(viaje.conductor().id())
					.tipo(TipoMovimiento.COBRO_VIAJE)
					.monto(total)
					.descripcion("%s · %s → %s".formatted(reserva.pasajero().nombre(), reserva.viaje().origen(),
							reserva.viaje().destino()))
					.reservaId(reserva.id())
					.viajeId(viaje.id())
					.fecha(fecha)
					.build()), reserva);
			cobrado += total;
		}
		return cobrado;
	}

	public static int valor(Integer creditos) {
		return creditos == null ? 0 : creditos;
	}

	// Solo una operación liquida la reserva: la condición liquidada = false deja fuera las ya liquidadas y las antiguas.
	private boolean marcarLiquidada(Reserva reserva, Instant fecha) {
		Query sinLiquidar = Query.query(Criteria.where("_id").is(reserva.id()).and("liquidada").is(false));
		return mongoTemplate.updateFirst(sinLiquidar, new Update().set("liquidada", true)
				.set("fecha_actualizacion", fecha), Reserva.class).getModifiedCount() > 0;
	}

	// Un abono o una liberación de retenidos que no se aplica indica datos inconsistentes: se revierte todo.
	private static void exigir(OptionalInt resultado, Reserva reserva) {
		if (resultado.isEmpty()) {
			throw new IllegalStateException("No se pudo liquidar la reserva " + reserva.id());
		}
	}
}
