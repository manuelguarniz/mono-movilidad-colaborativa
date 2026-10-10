package pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.dto;

import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Sede;

/** La dirección y la ubicación las usa «Publicar viaje»: la sede es un extremo de la ruta. */
public record SedeDto(String id, String name, String address, PuntoDto location) {

	public record PuntoDto(double lat, double lng) {
	}

	// En el Point GeoJSON x es la longitud e y la latitud.
	public static SedeDto desde(Sede sede) {
		PuntoDto ubicacion = sede.ubicacion() == null ? null
				: new PuntoDto(sede.ubicacion().getY(), sede.ubicacion().getX());
		return new SedeDto(sede.id().toHexString(), sede.nombre(), sede.direccion(), ubicacion);
	}
}
