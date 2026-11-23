package pe.edu.utp.app_movilidadcolaborativa.notifications.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.Notificacion;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.TipoNotificacion;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoAsistencia;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.model.Retiro;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Crea las notificaciones de RF-13 con los textos literales de su tabla. Se llama dentro de la transacción del cambio
 * de estado (RN-32): el insert usa la sesión de la transacción en curso, así que si la operación falla no queda
 * ninguna notificación. El aviso en tiempo real lo hace después el Change Stream, que solo ve lo confirmado.
 */
@Component
@RequiredArgsConstructor
public class Notificador {

	private static final DateTimeFormatter DIA_HORA =
			DateTimeFormatter.ofPattern("dd/MM HH:mm").withZone(ReglasViaje.ZONA_PERU);

	private final MongoTemplate mongoTemplate;

	/** Al conductor. La asistencia va aparte y solo a él (RN-22). */
	public void nuevaReserva(Viaje viaje, Reserva reserva, Instant fecha) {
		String mensaje = "%s reservó %d plaza(s) en tu viaje del %s."
				.formatted(reserva.pasajero().nombre(), reserva.plazas(), DIA_HORA.format(viaje.fechaSalida()));
		String asistencia = reserva.asistencia() == null ? null
				: "Necesita asistencia: " + etiqueta(reserva.asistencia().tipo()) + ".";
		guardar(viaje.conductor().id(), TipoNotificacion.NUEVA_RESERVA, mensaje, asistencia, viaje.id(), reserva.id(),
				fecha);
	}

	/** Al conductor; viaje ya trae las plazas devueltas. */
	public void reservaCancelada(Viaje viaje, Reserva reserva, Instant fecha) {
		int libres = viaje.plazasDisponibles() == null ? 0 : viaje.plazasDisponibles();
		String mensaje = "%s canceló su reserva en tu viaje del %s. %s"
				.formatted(reserva.pasajero().nombre(), DIA_HORA.format(viaje.fechaSalida()),
						libres == 1 ? "Queda 1 plaza libre." : "Quedan %d plazas libres.".formatted(libres));
		guardar(viaje.conductor().id(), TipoNotificacion.RESERVA_CANCELADA, mensaje, null, viaje.id(), reserva.id(),
				fecha);
	}

	/** A cada pasajero. Sin motivo, el texto de RF-13 para la cancelación automática del job (RF-08). */
	public void viajeCancelado(Viaje viaje, Reserva reserva, int devueltos, String motivo, boolean porSistema,
			Instant fecha) {
		StringBuilder mensaje = new StringBuilder("%s canceló el viaje del %s a %s."
				.formatted(viaje.conductor().nombre(), DIA_HORA.format(viaje.fechaSalida()), viaje.destino().etiqueta()));
		if (devueltos > 0) {
			mensaje.append(" Te devolvimos ").append(creditos(devueltos)).append('.');
		}
		if (porSistema) {
			mensaje.append(" El conductor no inició el viaje.");
		} else if (motivo != null && !motivo.isBlank()) {
			mensaje.append(" Motivo: ").append(motivo.strip());
		}
		guardar(reserva.pasajero().id(), TipoNotificacion.VIAJE_CANCELADO, mensaje.toString(), null, viaje.id(),
				reserva.id(), fecha);
	}

	/** A cada pasajero que subió (RN-43). */
	public void viajeIniciado(Viaje viaje, Reserva reserva, Instant fecha) {
		guardar(reserva.pasajero().id(), TipoNotificacion.VIAJE_INICIADO,
				"Tu viaje a %s inició.".formatted(viaje.destino().etiqueta()), null, viaje.id(), reserva.id(), fecha);
	}

	/** Al pasajero que no subió (RN-43); sus créditos se pagan al conductor al cerrar el viaje (RN-40). */
	public void noSePresento(Viaje viaje, Reserva reserva, Instant fecha) {
		String mensaje = "El conductor marcó que no subiste al viaje del %s. Se cobraron %s."
				.formatted(DIA_HORA.format(viaje.fechaSalida()), creditos(reserva.totalCreditos()));
		guardar(reserva.pasajero().id(), TipoNotificacion.NO_SE_PRESENTO, mensaje, null, viaje.id(), reserva.id(),
				fecha);
	}

	/** Al conductor: a quiénes calificar (RN-47) y lo cobrado (RN-40). */
	public void viajeCompletadoConductor(Viaje viaje, List<Reserva> completadas, int cobrado, Instant fecha) {
		StringBuilder mensaje = new StringBuilder("Tu viaje a %s terminó.".formatted(viaje.destino().etiqueta()));
		if (!completadas.isEmpty()) {
			mensaje.append(" ¡Califica a ")
					.append(enumerar(completadas.stream().map(reserva -> reserva.pasajero().nombre()).toList()))
					.append("!");
		}
		if (cobrado > 0) {
			mensaje.append(" Recibiste ").append(creditos(cobrado)).append('.');
		}
		guardar(viaje.conductor().id(), TipoNotificacion.VIAJE_COMPLETADO, mensaje.toString(), null, viaje.id(), null,
				fecha);
	}

	/** A cada pasajero COMPLETADA, que califica al conductor (RN-47). */
	public void viajeCompletadoPasajero(Viaje viaje, Reserva reserva, Instant fecha) {
		guardar(reserva.pasajero().id(), TipoNotificacion.VIAJE_COMPLETADO, "Tu viaje a %s terminó. ¡Califica a %s!"
				.formatted(viaje.destino().etiqueta(), viaje.conductor().nombre()), null, viaje.id(), reserva.id(), fecha);
	}

	/** Al conductor, cuando el job devuelve un retiro rechazado (RN-42). */
	public void retiroRechazado(Retiro retiro, Instant fecha) {
		String motivo = retiro.motivoRechazo() == null || retiro.motivoRechazo().isBlank() ? "sin motivo"
				: retiro.motivoRechazo().strip();
		guardar(retiro.usuarioId(), TipoNotificacion.RETIRO_RECHAZADO,
				"Tu retiro de %s fue rechazado: %s. Te devolvimos los créditos."
						.formatted(creditos(retiro.creditos()), quitarPunto(motivo)), null, null, null, fecha);
	}

	// ------------------------------------------------------------------- Apoyo

	private void guardar(ObjectId usuarioId, TipoNotificacion tipo, String mensaje, String asistencia,
			ObjectId viajeId, ObjectId reservaId, Instant fecha) {
		mongoTemplate.insert(Notificacion.builder()
				.usuarioId(usuarioId)
				.tipo(tipo)
				.titulo(tipo.getTitulo())
				.mensaje(mensaje)
				.asistencia(asistencia)
				.viajeId(viajeId)
				.reservaId(reservaId)
				.leida(false)
				.fechaCreacion(fecha)
				.build());
	}

	static String creditos(Integer cantidad) {
		int valor = cantidad == null ? 0 : cantidad;
		return valor + (valor == 1 ? " crédito" : " créditos");
	}

	/** «Lucía R.», «Lucía R. y Jorge P.», «Lucía R., Jorge P. y Sofía A.». */
	static String enumerar(List<String> nombres) {
		if (nombres.size() == 1) {
			return nombres.getFirst();
		}
		return String.join(", ", nombres.subList(0, nombres.size() - 1)) + " y " + nombres.getLast();
	}

	private static String quitarPunto(String texto) {
		return texto.endsWith(".") ? texto.substring(0, texto.length() - 1) : texto;
	}

	// Etiquetas de RF-02 (casuística B).
	private static String etiqueta(TipoAsistencia tipo) {
		return switch (tipo) {
			case SILLA_RUEDAS -> "Silla de ruedas";
			case MULETAS_ANDADOR -> "Muletas o andador";
			case OTRA -> "Otra";
		};
	}
}
