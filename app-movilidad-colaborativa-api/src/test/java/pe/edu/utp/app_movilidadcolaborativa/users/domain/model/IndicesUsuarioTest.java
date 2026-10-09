package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mapping.model.SnakeCaseFieldNamingStrategy;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.index.IndexDefinition;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import java.util.List;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

/** Los índices de usuarios se declaran con @Indexed, también el de la placa del vehículo embebido. */
class IndicesUsuarioTest {

	@Test
	void laPlacaTieneUnIndiceUnicoParcial() {
		MongoMappingContext contexto = new MongoMappingContext();
		contexto.setFieldNamingStrategy(new SnakeCaseFieldNamingStrategy());
		// Igual que en la aplicación: las fechas y los ObjectId son tipos simples, no documentos embebidos.
		contexto.setSimpleTypeHolder(new MongoCustomConversions(List.of()).getSimpleTypeHolder());
		contexto.setAutoIndexCreation(true);

		IndexDefinition placa = StreamSupport
				.stream(new MongoPersistentEntityIndexResolver(contexto).resolveIndexFor(Usuario.class).spliterator(),
						false)
				.map(IndexDefinition.class::cast)
				.filter(indice -> indice.getIndexKeys().containsKey("vehiculo.placa"))
				.findFirst().orElseThrow();

		assertThat(placa.getIndexOptions()).containsEntry("unique", true)
				.containsEntry("partialFilterExpression",
						new Document("vehiculo.placa", new Document("$exists", true)));
	}
}
