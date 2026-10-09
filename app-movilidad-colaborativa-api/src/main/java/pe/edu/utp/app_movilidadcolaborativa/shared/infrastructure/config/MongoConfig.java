package pe.edu.utp.app_movilidadcolaborativa.shared.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;

@Configuration
public class MongoConfig {

	// Sin esto Spring Data agrega a cada documento el campo _class, que no es parte del modelo de datos.
	public MongoConfig(MappingMongoConverter converter) {
		converter.setTypeMapper(new DefaultMongoTypeMapper(null));
	}

	// Transacciones de MongoDB (Atlas es un replica set): la reserva descuenta la plaza y se guarda en una sola.
	@Bean
	MongoTransactionManager transactionManager(MongoDatabaseFactory fabrica) {
		return new MongoTransactionManager(fabrica);
	}
}
