package pe.edu.utp.app_movilidadcolaborativa.notifications.application;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.BandejaDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.dto.NotificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.notifications.domain.model.Notificacion;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;

import java.util.List;

/** Bandeja y contador de RF-13. Cada consulta filtra por el usuario del token: nadie ve ni marca ajenas (RN-34). */
@Service
@RequiredArgsConstructor
public class NotificacionService {

	/** RF-13: la bandeja muestra hasta 50, la más reciente primero. */
	static final int MAXIMO_BANDEJA = 50;

	private final MongoTemplate mongoTemplate;

	public BandejaDto bandeja(ObjectId usuarioId) {
		Query consulta = Query.query(Criteria.where("usuario_id").is(usuarioId))
				.with(Sort.by(Sort.Direction.DESC, "fecha_creacion"))
				.limit(MAXIMO_BANDEJA);
		List<NotificacionDto> data = mongoTemplate.find(consulta, Notificacion.class).stream()
				.map(NotificacionDto::desde).toList();
		return new BandejaDto(data, noLeidas(usuarioId));
	}

	public long noLeidas(ObjectId usuarioId) {
		return mongoTemplate.count(Query.query(Criteria.where("usuario_id").is(usuarioId).and("leida").is(false)),
				Notificacion.class);
	}

	/** Marcar una ya leída no es error: devuelve el contador igual. Una ajena responde como inexistente. */
	public long marcarLeida(ObjectId usuarioId, ObjectId notificacionId) {
		Query propia = Query.query(Criteria.where("_id").is(notificacionId).and("usuario_id").is(usuarioId));
		if (!mongoTemplate.exists(propia, Notificacion.class)) {
			throw new ApiException(CodigoError.NOTIFICATION_NOT_FOUND, "Notificación no encontrada");
		}
		mongoTemplate.updateFirst(propia.addCriteria(Criteria.where("leida").is(false)),
				new Update().set("leida", true), Notificacion.class);
		return noLeidas(usuarioId);
	}

	public long marcarTodas(ObjectId usuarioId) {
		mongoTemplate.updateMulti(Query.query(Criteria.where("usuario_id").is(usuarioId).and("leida").is(false)),
				new Update().set("leida", true), Notificacion.class);
		return 0;
	}
}
