package pe.edu.utp.app_movilidadcolaborativa.shared.domain.validation;

import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/** Acumula los errores por campo de una solicitud y los lanza juntos. */
public class Validacion {

	private static final Pattern OBJECT_ID = Pattern.compile("^[0-9a-f]{24}$");

	private final List<ErrorCampo> errores = new ArrayList<>();

	public static boolean esObjectId(String valor) {
		return valor != null && OBJECT_ID.matcher(valor).matches();
	}

	/** Registra el error si la condición no se cumple y el campo aún no tiene uno. */
	public Validacion exigir(boolean condicion, String campo, String mensaje) {
		if (!condicion && errores.stream().noneMatch(e -> e.field().equals(campo))) {
			errores.add(new ErrorCampo(campo, mensaje));
		}
		return this;
	}

	public void lanzarSiHayErrores(String mensaje) {
		if (!errores.isEmpty()) {
			throw new ValidacionException(mensaje, errores);
		}
	}
}
