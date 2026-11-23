package pe.edu.utp.app_movilidadcolaborativa.rides.domain;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mapping.model.SnakeCaseFieldNamingStrategy;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.IndexDefinition;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/** Reglas de los viajes (RN-12, distancia, duración y búsqueda) e índices de viajes y reservas. */
class ReglasViajeTest {

	// Perú está en UTC-5 todo el año.
	private static final Instant AHORA = Instant.parse("2026-10-09T15:00:00Z");
	private static final LocalTime SEIS = LocalTime.of(6, 0);
	private static final LocalTime VEINTITRES = LocalTime.of(23, 0);

	@Test
	void laSalidaEsFuturaYEstaEntreLasSeisYLasVeintitres() {
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-09T15:00:01Z"), AHORA, SEIS, VEINTITRES)).isTrue();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-10T11:00:00Z"), AHORA, SEIS, VEINTITRES)).isTrue();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-10T04:00:00Z"), AHORA, SEIS, VEINTITRES)).isTrue();

		assertThat(ReglasViaje.esHoraSalidaValida(AHORA, AHORA, SEIS, VEINTITRES)).isFalse();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-10T10:59:00Z"), AHORA, SEIS, VEINTITRES)).isFalse();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-10T04:01:00Z"), AHORA, SEIS, VEINTITRES)).isFalse();
		assertThat(ReglasViaje.esHoraSalidaValida(null, AHORA, SEIS, VEINTITRES)).isFalse();
	}

	@Test
	void elHorarioDeSalidaSeConfigura() {
		// 2026-10-10T12:00Z es 7:00 en Perú; 2026-10-11T03:30Z es 22:30.
		LocalTime ocho = LocalTime.of(8, 0);
		LocalTime veintidos = LocalTime.of(22, 0);
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-10T12:00:00Z"), AHORA, ocho, veintidos))
				.isFalse();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-11T03:30:00Z"), AHORA, ocho, veintidos))
				.isFalse();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-10T13:00:00Z"), AHORA, ocho, veintidos))
				.isTrue();
	}

	@Test
	void elHorarioDeSalidaPuedeCruzarLaMedianoche() {
		// 22:00 a 02:00 de Perú. 2026-10-11T04:30Z es 23:30; 2026-10-11T06:00Z es 1:00; 2026-10-11T08:00Z es 3:00.
		LocalTime veintidos = LocalTime.of(22, 0);
		LocalTime dos = LocalTime.of(2, 0);
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-11T04:30:00Z"), AHORA, veintidos, dos))
				.isTrue();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-11T06:00:00Z"), AHORA, veintidos, dos))
				.isTrue();
		assertThat(ReglasViaje.esHoraSalidaValida(Instant.parse("2026-10-11T08:00:00Z"), AHORA, veintidos, dos))
				.isFalse();
	}

	@Test
	void laDistanciaSumaLosTramosEnLineaRectaYLaDuracionSeEstima() {
		GeoJsonPoint sede = new GeoJsonPoint(-79.0353, -8.0975);
		GeoJsonPoint ovalo = new GeoJsonPoint(-79.0389, -8.0851);
		GeoJsonPoint huaca = new GeoJsonPoint(-79.0412, -8.0716);

		assertThat(ReglasViaje.distanciaKm(List.of(sede, huaca))).isCloseTo(2.9, within(0.1));
		assertThat(ReglasViaje.distanciaKm(List.of(sede, ovalo, huaca)))
				.isGreaterThanOrEqualTo(ReglasViaje.distanciaKm(List.of(sede, huaca)));
		assertThat(ReglasViaje.distanciaKm(List.of(sede, sede))).isZero();

		assertThat(ReglasViaje.duracionMin(8.5, 35)).isEqualTo(15);
		assertThat(ReglasViaje.duracionMin(0, 35)).isEqualTo(1);
		assertThat(ReglasViaje.duracionMin(8.5, 17)).isEqualTo(30);
	}

	@Test
	void laBusquedaNoDistingueMayusculasNiTildes() {
		Pattern patron = Pattern.compile(ReglasViaje.patronSinTildes(" huaca del dragon (arco "),
				Pattern.CASE_INSENSITIVE);

		assertThat(patron.matcher("Huaca del Dragón (Arco Iris)").find()).isTrue();
		assertThat(patron.matcher("HUACA DEL DRAGÓN (ARCO IRIS)").find()).isTrue();
		assertThat(patron.matcher("Huaca del Sol").find()).isFalse();
		Pattern conEnie = Pattern.compile(ReglasViaje.patronSinTildes("Piñán"), Pattern.CASE_INSENSITIVE);
		assertThat(conEnie.matcher("Av. PIÑÁN 120").find()).isTrue();
		assertThat(conEnie.matcher("av. pinan 120").find()).isTrue();
	}

	@Test
	void losIndicesDeViajesYReservasEstanDeclarados() {
		MongoMappingContext contexto = new MongoMappingContext();
		contexto.setFieldNamingStrategy(new SnakeCaseFieldNamingStrategy());
		// Igual que en la aplicación: las fechas y los ObjectId son tipos simples, no documentos embebidos.
		contexto.setSimpleTypeHolder(new MongoCustomConversions(List.of()).getSimpleTypeHolder());
		contexto.setAutoIndexCreation(true);
		MongoPersistentEntityIndexResolver indices = new MongoPersistentEntityIndexResolver(contexto);

		assertThat(indicesDe(indices, Viaje.class)).extracting(IndexDefinition::getIndexKeys).containsExactlyInAnyOrder(
				new Document("estado", 1).append("sede.id", 1).append("fecha_salida", 1),
				new Document("conductor.id", 1).append("estado", 1),
				new Document("conductor.id", 1).append("fecha_salida", -1));
		// El historial del pasajero (RF-09).
		assertThat(indicesDe(indices, Reserva.class)).extracting(IndexDefinition::getIndexKeys)
				.contains(new Document("pasajero.id", 1).append("viaje.fecha_salida", -1));
		assertThat(indicesDe(indices, Reserva.class)).filteredOn(indice -> indice.getIndexOptions()
				.containsKey("unique")).singleElement().satisfies(indice -> {
			assertThat(indice.getIndexKeys()).isEqualTo(new Document("viaje_id", 1).append("pasajero.id", 1));
			assertThat(indice.getIndexOptions()).containsEntry("unique", true)
					.containsEntry("partialFilterExpression", new Document("estado", "CONFIRMADA"));
		});
	}

	private static List<IndexDefinition> indicesDe(MongoPersistentEntityIndexResolver indices, Class<?> tipo) {
		return StreamSupport.stream(indices.resolveIndexFor(tipo).spliterator(), false)
				.map(IndexDefinition.class::cast).toList();
	}
}
