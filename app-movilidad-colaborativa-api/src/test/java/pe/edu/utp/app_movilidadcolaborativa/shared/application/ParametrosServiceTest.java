package pe.edu.utp.app_movilidadcolaborativa.shared.application;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import pe.edu.utp.app_movilidadcolaborativa.shared.application.ParametrosService.Parametros;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** RN-31: los parámetros salen del documento app/config y, si faltan o no son válidos, de los valores por defecto. */
class ParametrosServiceTest {

	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final ParametrosService servicio = new ParametrosService(mongoTemplate);

	@Test
	void sinDocumentoSeUsanLosValoresPorDefecto() {
		assertThat(servicio.leer()).isEqualTo(Parametros.POR_DEFECTO);
	}

	@Test
	void leeLosValoresDelDocumentoYCompletaLosQueFaltan() {
		when(mongoTemplate.findById("config", Document.class, "app")).thenReturn(new Document("_id", "config")
				.append("hora_minima_salida", "07:30")
				.append("hora_maxima_salida", "22:00")
				.append("precio_maximo_plaza", 15)
				.append("velocidad_promedio_km_h", 28.5)
				.append("max_dias_soat", 365L));

		Parametros parametros = servicio.leer();

		assertThat(parametros.horaMinimaSalida()).isEqualTo(LocalTime.of(7, 30));
		assertThat(parametros.horaMaximaSalida()).isEqualTo(LocalTime.of(22, 0));
		assertThat(parametros.precioMaximoPlaza()).isEqualTo(15);
		assertThat(parametros.velocidadPromedioKmH()).isEqualTo(28.5);
		assertThat(parametros.maxDiasSoat()).isEqualTo(365);
		assertThat(parametros.precioMinimoPlaza()).isEqualTo(1);
		assertThat(parametros.maxParadas()).isEqualTo(5);
	}

	@Test
	void unValorConOtroTipoOMalFormadoUsaElPorDefecto() {
		when(mongoTemplate.findById("config", Document.class, "app")).thenReturn(new Document("_id", "config")
				.append("hora_minima_salida", "6 am")
				.append("hora_maxima_salida", 23)
				.append("max_paradas", "5")
				.append("velocidad_promedio_km_h", 0));

		Parametros parametros = servicio.leer();

		assertThat(parametros.horaMinimaSalida()).isEqualTo(LocalTime.of(6, 0));
		assertThat(parametros.horaMaximaSalida()).isEqualTo(LocalTime.of(23, 0));
		assertThat(parametros.maxParadas()).isEqualTo(5);
		assertThat(parametros.velocidadPromedioKmH()).isEqualTo(35);
	}
}
