package pe.edu.utp.app_movilidadcolaborativa.shared.domain.model;

/** Claim scope del JWT: decide qué endpoints admite el token. */
public enum AlcanceToken {
	REGISTRATION,
	PRE_AUTH,
	SESSION;

	/** Autoridad con la que Spring Security expone el claim scope del token. */
	public String autoridad() {
		return "SCOPE_" + name();
	}
}
