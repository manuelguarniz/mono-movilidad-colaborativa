package pe.edu.utp.app_movilidadcolaborativa.users.domain.model;

import java.time.Instant;

/**
 * Necesidad de asistencia de movilidad que declara el pasajero (RN-17). Es un dato sensible (Ley 29733): solo se
 * guarda con consentimiento, nunca se copia en viajes ni se escribe en los logs (RN-22, RNF-13). nota tiene hasta
 * 120 caracteres y puede faltar.
 */
public record AsistenciaMovilidad(TipoAsistencia tipo, String nota, Instant fechaConsentimiento) {
}
