package pe.edu.utp.app_movilidadcolaborativa.shared.application;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

/**
 * Parámetros de negocio del documento { _id: "config" } de la colección app (RN-31). Se leen en cada operación,
 * sin caché, para que un cambio en la base de datos rija desde la siguiente. Si falta un valor, se usa el de por
 * defecto (README, sección 5.1). Solo están los parámetros que ya usa el backend.
 */
@Service
@RequiredArgsConstructor
public class ParametrosService {

	private static final String COLECCION = "app";
	private static final String ID = "config";

	private final MongoTemplate mongoTemplate;

	public record Parametros(int maxCancelacionesConductor, int ventanaCancelacionesDias) {

		public static final Parametros POR_DEFECTO = new Parametros(10, 30);
	}

	public Parametros leer() {
		Document config = mongoTemplate.findById(ID, Document.class, COLECCION);
		if (config == null) {
			return Parametros.POR_DEFECTO;
		}
		return new Parametros(
				entero(config, "max_cancelaciones_conductor", Parametros.POR_DEFECTO.maxCancelacionesConductor()),
				entero(config, "ventana_cancelaciones_dias", Parametros.POR_DEFECTO.ventanaCancelacionesDias()));
	}

	private static int entero(Document config, String campo, int porDefecto) {
		return config.get(campo) instanceof Number valor ? valor.intValue() : porDefecto;
	}
}
