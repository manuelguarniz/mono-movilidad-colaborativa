package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

/**
 * Los dos checks de accesibilidad del vehículo (RN-18). El vehículo es apto para movilidad reducida si puede
 * llevar una silla de ruedas plegable. Una MOTO no puede marcar ninguno.
 */
public record Accesibilidad(Boolean sillaRuedas, Boolean ayudaAbordaje) {

	public static final Accesibilidad NINGUNA = new Accesibilidad(false, false);

	public boolean esApto() {
		return Boolean.TRUE.equals(sillaRuedas);
	}

	public boolean tieneAlguna() {
		return Boolean.TRUE.equals(sillaRuedas) || Boolean.TRUE.equals(ayudaAbordaje);
	}
}
