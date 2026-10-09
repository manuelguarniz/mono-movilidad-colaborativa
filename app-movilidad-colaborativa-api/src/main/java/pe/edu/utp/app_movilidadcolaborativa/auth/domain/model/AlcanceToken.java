package pe.edu.utp.app_movilidadcolaborativa.auth.domain.model;

/** Claim scope del JWT: decide qué endpoints admite el token. */
public enum AlcanceToken {
	REGISTRATION,
	PRE_AUTH,
	SESSION
}
