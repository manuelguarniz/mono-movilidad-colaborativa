package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

/** Documento nacional de identidad o carné de extranjería; se llama igual en MongoDB y en la API. */
public enum TipoDocumento {
	DNI,
	CE;

	/** Devuelve null si el valor no es un tipo de documento. */
	public static TipoDocumento desde(String valor) {
		for (TipoDocumento tipo : values()) {
			if (tipo.name().equals(valor)) {
				return tipo;
			}
		}
		return null;
	}
}
