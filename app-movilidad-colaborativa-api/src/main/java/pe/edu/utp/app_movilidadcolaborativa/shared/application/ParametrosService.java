package pe.edu.utp.app_movilidadcolaborativa.shared.application;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;

/**
 * Parámetros de negocio del documento { _id: "config" } de la colección app (RN-31). Se leen en cada operación,
 * sin caché, para que un cambio en la base de datos rija desde la siguiente. Si falta un valor o no tiene el tipo
 * esperado, se usa el de por defecto (README, sección 5.1). Solo están los parámetros que ya usa el backend.
 */
@Service
@RequiredArgsConstructor
public class ParametrosService {

	private static final String COLECCION = "app";
	private static final String ID = "config";

	private final MongoTemplate mongoTemplate;

	/**
	 * Cancelaciones (RN-25, RN-26, RN-30, RN-38), inicio del viaje (RN-43, RN-44), billetera (RN-41, RN-42),
	 * calificación (RN-47), publicación del viaje (RN-10, RN-12, RN-13 y la duración estimada) y vehículo
	 * (RN-08, RN-09, RN-36).
	 */
	public record Parametros(int maxCancelacionesConductor, int maxCancelacionesPasajero,
			int ventanaCancelacionesDias, int minutosLimiteCancelacion, int minutosInicioAnticipado,
			int minutosToleranciaInicio, int recargaMinima, int recargaMaxima, int retiroMinimo,
			int diasParaCalificar, LocalTime horaMinimaSalida, LocalTime horaMaximaSalida, int precioMinimoPlaza,
			int precioMaximoPlaza, int maxParadas, int maxCondiciones, double velocidadPromedioKmH,
			int anioMinimoVehiculo, int maxAsientosVehiculo, int maxDiasSoat) {

		public static final Parametros POR_DEFECTO = new Parametros(10, 5, 30, 30, 15, 30, 5, 200, 10, 1,
				LocalTime.of(6, 0), LocalTime.of(23, 0), 1, 10, 5, 10, 35, 2000, 10, 366);
	}

	public Parametros leer() {
		Document config = mongoTemplate.findById(ID, Document.class, COLECCION);
		if (config == null) {
			return Parametros.POR_DEFECTO;
		}
		Parametros d = Parametros.POR_DEFECTO;
		return new Parametros(
				entero(config, "max_cancelaciones_conductor", d.maxCancelacionesConductor()),
				entero(config, "max_cancelaciones_pasajero", d.maxCancelacionesPasajero()),
				entero(config, "ventana_cancelaciones_dias", d.ventanaCancelacionesDias()),
				entero(config, "minutos_limite_cancelacion", d.minutosLimiteCancelacion()),
				entero(config, "minutos_inicio_anticipado", d.minutosInicioAnticipado()),
				entero(config, "minutos_tolerancia_inicio", d.minutosToleranciaInicio()),
				entero(config, "recarga_minima", d.recargaMinima()),
				entero(config, "recarga_maxima", d.recargaMaxima()),
				entero(config, "retiro_minimo", d.retiroMinimo()),
				entero(config, "dias_para_calificar", d.diasParaCalificar()),
				hora(config, "hora_minima_salida", d.horaMinimaSalida()),
				hora(config, "hora_maxima_salida", d.horaMaximaSalida()),
				entero(config, "precio_minimo_plaza", d.precioMinimoPlaza()),
				entero(config, "precio_maximo_plaza", d.precioMaximoPlaza()),
				entero(config, "max_paradas", d.maxParadas()),
				entero(config, "max_condiciones", d.maxCondiciones()),
				decimal(config, "velocidad_promedio_km_h", d.velocidadPromedioKmH()),
				entero(config, "anio_minimo_vehiculo", d.anioMinimoVehiculo()),
				entero(config, "max_asientos_vehiculo", d.maxAsientosVehiculo()),
				entero(config, "max_dias_soat", d.maxDiasSoat()));
	}

	private static int entero(Document config, String campo, int porDefecto) {
		return config.get(campo) instanceof Number valor ? valor.intValue() : porDefecto;
	}

	// Solo valores positivos: la velocidad divide la distancia.
	private static double decimal(Document config, String campo, double porDefecto) {
		return config.get(campo) instanceof Number valor && valor.doubleValue() > 0 ? valor.doubleValue() : porDefecto;
	}

	/** Hora local de Perú en formato "HH:mm", por ejemplo "06:00". */
	private static LocalTime hora(Document config, String campo, LocalTime porDefecto) {
		if (!(config.get(campo) instanceof String valor)) {
			return porDefecto;
		}
		try {
			return LocalTime.parse(valor.trim());
		} catch (DateTimeParseException _) {
			return porDefecto;
		}
	}
}
