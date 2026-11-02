package pe.edu.utp.app_movilidadcolaborativa.rides.application;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.domain.model.Sede;
import pe.edu.utp.app_movilidadcolaborativa.catalogs.infrastructure.persistence.SedeRepository;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.FiltroViajesRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ListadoViajesDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.LugarDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.LugarDto.PuntoDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.PublicarViajeRequest;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeDetalleDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.dto.ViajeResumenDto;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.EstadoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Reserva;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.SedeViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.SentidoViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.model.Viaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.domain.validation.ReglasViaje;
import pe.edu.utp.app_movilidadcolaborativa.rides.infrastructure.persistence.ViajeRepository;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.dto.ErrorDto.ErrorCampo;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ApiException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.CodigoError;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.exception.ValidacionException;
import pe.edu.utp.app_movilidadcolaborativa.shared.domain.model.ReferenciaNombre;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.dto.PerfilUsuarioDto.CalificacionDto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Accesibilidad;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Calificacion;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.EstadoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Foto;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.SedeUsuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Soat;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoVehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Usuario;
import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.Vehiculo;
import pe.edu.utp.app_movilidadcolaborativa.users.infrastructure.persistence.UsuarioRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Camino feliz y reglas de estado de los viajes (RF-09 a RF-12 y RF-15 a RF-18), sin base de datos. */
class ViajeServiceTest {

	private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
	private final ViajeRepository viajeRepository = mock(ViajeRepository.class);
	private final MongoTemplate mongoTemplate = mock(MongoTemplate.class);
	private final CancelacionesConductorService cancelaciones = mock(CancelacionesConductorService.class);
	private final RestriccionesPasajeroService restricciones = mock(RestriccionesPasajeroService.class);
	private final SedeRepository sedeRepository = mock(SedeRepository.class);
	private final ViajeService servicio = new ViajeService(usuarioRepository, viajeRepository, mongoTemplate,
			cancelaciones, restricciones, sedeRepository);

	// La ciudad del viaje es el distrito de la sede en el catálogo (RN-49).
	{
		when(sedeRepository.findById(Viajes.SEDE_ID)).thenReturn(Optional.of(new Sede(Viajes.SEDE_ID,
				"UTP Sede Trujillo", "UTP", "Av. Nicolás de Piérola",
				new ReferenciaNombre(new ObjectId(), "Trujillo"), null, true)));
	}
	private final ObjectId usuarioId = new ObjectId();

	private Usuario.UsuarioBuilder pasajero() {
		return Usuario.builder()
				.id(usuarioId)
				.nombres("Carlos Alberto")
				.apellidos("Mendoza Ruiz")
				.sede(new SedeUsuario(Viajes.SEDE_ID, "UTP Sede Trujillo", "Av. Nicolás de Piérola 1221"))
				.foto(new Foto(new ObjectId(), "/uploads/perfiles/c.jpg"))
				.calificacion(new Calificacion(4.9, 120))
				.estado(EstadoUsuario.ACTIVO);
	}

	// Salida de solicitud(): 15/01/2030 a las 13:30 de Perú.
	private static final LocalDate DIA_SALIDA = LocalDate.of(2030, 1, 15);

	private static Vehiculo vehiculo(EstadoVehiculo estado, Accesibilidad accesibilidad, Soat soat) {
		return new Vehiculo("ABC-123", TipoVehiculo.SEDAN, "Toyota", "Yaris", "Blanco", 2021, 3, "45678912", true,
				estado, null, null, Instant.now(), accesibilidad, soat);
	}

	private static Soat soatHasta(LocalDate fin) {
		return new Soat("Rímac Seguros", "2401-123456", Soat.inicioDelDia(fin.minusDays(365)), Soat.inicioDelDia(fin),
				null, Instant.now());
	}

	// Vehículo registrado antes de RN-18 y RN-36: sin accesibilidad ni SOAT.
	private Usuario conductor() {
		return pasajero().vehiculo(vehiculo(EstadoVehiculo.ACTIVO, null, null)).build();
	}

	private void existe(Usuario usuario) {
		when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
	}

	private static PublicarViajeRequest solicitud(int plazas) {
		return new PublicarViajeRequest("TO_HOME", Instant.parse("2030-01-15T18:30:00Z"),
				new LugarDto("UTP Sede Trujillo", "Av. Nicolás de Piérola", new PuntoDto(-8.0975, -79.0353)),
				new LugarDto("Huaca del Dragón", null, new PuntoDto(-8.0716, -79.0412)),
				List.of(new LugarDto("Óvalo Papal", null, new PuntoDto(-8.0851, -79.0389))),
				5, plazas, List.of("No gritar"));
	}

	private Document consultaDelListado() {
		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(consulta.capture(), eq(Viaje.class));
		assertThat(consulta.getValue().getSortObject()).isEqualTo(new Document("fecha_salida", 1).append("_id", 1));
		return consulta.getValue().getQueryObject();
	}

	private static void falla(Runnable accion, CodigoError codigo) {
		assertThatThrownBy(accion::run).isInstanceOfSatisfying(ApiException.class,
				ex -> assertThat(ex.getCodigo()).isEqualTo(codigo));
	}

	// ------------------------------------------------------------ Camino feliz

	@Test
	void publicarCreaElViajeConLasCopiasDelConductorYLaDistanciaCalculada() {
		existe(conductor());

		ViajeDetalleDto respuesta = servicio.publicar(usuarioId, solicitud(3));

		ArgumentCaptor<Viaje> guardado = ArgumentCaptor.forClass(Viaje.class);
		verify(viajeRepository).insert(guardado.capture());
		Viaje viaje = guardado.getValue();
		assertThat(viaje.estado()).isEqualTo(EstadoViaje.PUBLICADO);
		assertThat(viaje.sentido()).isEqualTo(SentidoViaje.REGRESO_CASA);
		assertThat(viaje.conductor().id()).isEqualTo(usuarioId);
		assertThat(viaje.conductor().nombre()).isEqualTo("Carlos M.");
		assertThat(viaje.sede()).isEqualTo(new SedeViaje(Viajes.SEDE_ID, "UTP Sede Trujillo", "Trujillo"));
		assertThat(viaje.vehiculo().placa()).isEqualTo("ABC-123");
		assertThat(viaje.plazasTotales()).isEqualTo(3);
		assertThat(viaje.plazasDisponibles()).isEqualTo(3);
		// En el Point GeoJSON x es la longitud e y la latitud.
		assertThat(viaje.origen().ubicacion().getX()).isEqualTo(-79.0353);
		assertThat(viaje.origen().ubicacion().getY()).isEqualTo(-8.0975);
		assertThat(viaje.paradas()).hasSize(1);
		// Pasar por la parada alarga la línea recta de 2.9 km entre el origen y el destino.
		assertThat(viaje.distanciaKm()).isEqualTo(3.0);
		assertThat(viaje.duracionMin()).isEqualTo(6);
		assertThat(viaje.fechaCreacion()).isEqualTo(viaje.fechaActualizacion()).isNotNull();

		assertThat(respuesta.id()).isEqualTo(viaje.id().toHexString());
		assertThat(respuesta.status()).isEqualTo("PUBLISHED");
		assertThat(respuesta.direction()).isEqualTo("TO_HOME");
		assertThat(respuesta.departureTime()).isEqualTo(Instant.parse("2030-01-15T18:30:00Z"));
		assertThat(respuesta.availableSeats()).isEqualTo(3);
		assertThat(respuesta.driver()).isEqualTo(new ViajeResumenDto.Conductor(usuarioId.toHexString(), "Carlos M.",
				"/uploads/perfiles/c.jpg", new CalificacionDto(4.9, 120)));
		assertThat(respuesta.vehicle())
				.isEqualTo(new ViajeResumenDto.Vehiculo("Toyota", "Yaris", "Blanco", "ABC-123", false, null));
		assertThat(respuesta.origin()).isEqualTo(solicitud(3).origin());
		assertThat(respuesta.stops()).isEqualTo(solicitud(3).stops());
		assertThat(respuesta.conditions()).containsExactly("No gritar");
	}

	@Test
	void publicarCopiaLaAccesibilidadYElFinDelSoatDelVehiculo() {
		existe(pasajero().vehiculo(vehiculo(EstadoVehiculo.ACTIVO, new Accesibilidad(true, false),
				soatHasta(DIA_SALIDA))).build());

		ViajeDetalleDto respuesta = servicio.publicar(usuarioId, solicitud(3));

		ArgumentCaptor<Viaje> guardado = ArgumentCaptor.forClass(Viaje.class);
		verify(viajeRepository).insert(guardado.capture());
		assertThat(guardado.getValue().vehiculo().aptoMovilidadReducida()).isTrue();
		assertThat(guardado.getValue().vehiculo().soatFechaFin()).isEqualTo(Soat.inicioDelDia(DIA_SALIDA));
		assertThat(respuesta.vehicle().wheelchairAccessible()).isTrue();
		assertThat(respuesta.vehicle().soatEndDate()).isEqualTo(DIA_SALIDA);
	}

	@Test
	void sinDistritoEnElCatalogoElViajeQuedaSinCiudad() {
		existe(conductor());
		when(sedeRepository.findById(Viajes.SEDE_ID)).thenReturn(Optional.of(new Sede(Viajes.SEDE_ID,
				"UTP Sede Trujillo", "UTP", "Av. Nicolás de Piérola", null, null, true)));

		assertThat(servicio.publicar(usuarioId, solicitud(1)).campus())
				.isEqualTo(new ViajeResumenDto.Sede(Viajes.SEDE_ID.toHexString(), "UTP Sede Trujillo", null));
	}

	private static FiltroViajesRequest sinFiltros() {
		return new FiltroViajesRequest(null, null, null, null, null, null);
	}

	@Test
	void listarBuscaLosViajesPublicadosDeTodasLasSedes() {
		existe(pasajero().build());
		ObjectId viajeId = new ObjectId();
		when(mongoTemplate.find(any(Query.class), eq(Viaje.class)))
				.thenReturn(List.of(Viajes.publicado(viajeId, new ObjectId()).build()));
		Instant antes = Instant.now();

		ListadoViajesDto listado = servicio.listar(usuarioId, sinFiltros());

		assertThat(listado.page()).isEqualTo(1);
		assertThat(listado.hasMore()).isFalse();
		assertThat(listado.activeBooking()).isNull();
		assertThat(listado.bookingBlock()).isNull();
		assertThat(listado.data()).singleElement().satisfies(viaje -> {
			assertThat(viaje.campus().city()).isEqualTo("Trujillo");
			assertThat(viaje.vehicle().wheelchairAccessible()).isTrue();
			assertThat(viaje.id()).isEqualTo(viajeId.toHexString());
			assertThat(viaje.status()).isEqualTo("PUBLISHED");
			assertThat(viaje.direction()).isEqualTo("TO_HOME");
			assertThat(viaje.driver().name()).isEqualTo("Carlos M.");
			assertThat(viaje.destination())
					.isEqualTo(new ViajeResumenDto.LugarResumen("Huaca del Dragón", "La Esperanza, Trujillo"));
			assertThat(viaje.conditions()).containsExactly("No gritar");
		});
		Document consulta = consultaDelListado();
		assertThat(consulta).containsEntry("estado", EstadoViaje.PUBLICADO)
				.doesNotContainKey("sede.id")
				.doesNotContainKey("vehiculo.apto_movilidad_reducida")
				.containsEntry("plazas_disponibles", new Document("$gte", 1))
				.containsEntry("conductor.id", new Document("$ne", usuarioId))
				.doesNotContainKey("$or");
		Document salida = consulta.get("fecha_salida", Document.class);
		assertThat(salida).containsOnlyKeys("$gt");
		assertThat(salida.get("$gt", Instant.class)).isBetween(antes, Instant.now());
	}

	@Test
	void listarAplicaLosFiltrosDeSedeDestinoHoraPasajerosYAccesibilidad() {
		existe(pasajero().build());
		when(mongoTemplate.find(any(Query.class), eq(Viaje.class))).thenReturn(List.of());
		ObjectId otraSede = new ObjectId();
		Instant ahora = Instant.now();

		assertThat(servicio.listar(usuarioId, new FiltroViajesRequest(otraSede.toHexString(), "dragon", "00:00", "2",
				"true", null)).data()).isEmpty();

		Document consulta = consultaDelListado();
		assertThat(consulta).containsEntry("sede.id", otraSede)
				.containsEntry("vehiculo.apto_movilidad_reducida", true)
				.containsEntry("plazas_disponibles", new Document("$gte", 2));
		// La hora pedida ya pasó: la salida sigue siendo futura, pero solo de hoy en la hora de Perú.
		Document salida = consulta.get("fecha_salida", Document.class);
		assertThat(salida.get("$gt", Instant.class)).isAfterOrEqualTo(ahora);
		assertThat(salida.get("$lt", Instant.class)).isEqualTo(LocalDate.ofInstant(ahora, ReglasViaje.ZONA_PERU)
				.plusDays(1).atStartOfDay(ReglasViaje.ZONA_PERU).toInstant());
		assertThat(consulta.getList("$or", Document.class)).extracting(filtro -> filtro.keySet().iterator().next())
				.containsExactly("destino.etiqueta", "destino.direccion");
		assertThat(consulta.getList("$or", Document.class).getFirst().get("destino.etiqueta"))
				.asString().endsWith("g[oóòöôõOÓÒÖÔÕ][nñNÑ]");
	}

	@Test
	void consultarDevuelveLaRutaCompleta() {
		ObjectId viajeId = new ObjectId();
		when(viajeRepository.findById(viajeId))
				.thenReturn(Optional.of(Viajes.publicado(viajeId, usuarioId).estado(EstadoViaje.COMPLETADO).build()));

		ViajeDetalleDto viaje = servicio.consultar(viajeId);

		assertThat(viaje.status()).isEqualTo("COMPLETED");
		assertThat(viaje.origin().location()).isEqualTo(new PuntoDto(-8.0975, -79.0353));
		assertThat(viaje.stops()).containsExactly(new LugarDto("Óvalo Papal", null, new PuntoDto(-8.0851, -79.0389)));
		assertThat(viaje.destination().label()).isEqualTo("Huaca del Dragón");
		assertThat(viaje.createdAt()).isNotNull();
	}

	// ------------------------------------------------------- Reglas de estado

	@Test
	void publicarExigeUnVehiculoYRespetaSusPlazas() {
		existe(pasajero().build());
		falla(() -> servicio.publicar(usuarioId, solicitud(1)), CodigoError.VEHICLE_REQUIRED);

		existe(conductor());
		assertThat(catchThrowableOfType(ValidacionException.class, () -> servicio.publicar(usuarioId, solicitud(4)))
				.getErrores())
				.containsExactly(new ErrorCampo("seats", "Las plazas no pueden superar las de tu vehículo"));
		verifyNoInteractions(viajeRepository);
	}

	@Test
	void publicarExigeUnVehiculoActivo() {
		existe(pasajero().vehiculo(vehiculo(EstadoVehiculo.INACTIVO, null, null)).build());

		falla(() -> servicio.publicar(usuarioId, solicitud(1)), CodigoError.VEHICLE_REQUIRED);
		verifyNoInteractions(viajeRepository);
	}

	@Test
	void publicarRespetaElLimiteDeCancelaciones() {
		existe(conductor());
		Instant hasta = Instant.parse("2026-11-14T15:00:00Z");
		when(cancelaciones.bloqueo(eq(usuarioId), any(Instant.class)))
				.thenReturn(Optional.of(new CancelacionesConductorService.Bloqueo(10, 30, hasta)));

		ApiException error = catchThrowableOfType(ApiException.class,
				() -> servicio.publicar(usuarioId, solicitud(1)));

		assertThat(error.getCodigo()).isEqualTo(CodigoError.DRIVER_CANCELLATION_LIMIT);
		assertThat(error.getMessage())
				.isEqualTo("Cancelaste 10 viajes en los últimos 30 días. Podrás publicar de nuevo desde el 14/11.");
		assertThat(error.getDetalles()).containsEntry("count", 10).containsEntry("until", hasta);
		verifyNoInteractions(viajeRepository);
	}

	@Test
	void publicarExigeElSoatVigenteEnLaFechaDeSalida() {
		// Vence el día anterior a la salida.
		existe(pasajero().vehiculo(vehiculo(EstadoVehiculo.ACTIVO, null, soatHasta(DIA_SALIDA.minusDays(1))))
				.build());
		falla(() -> servicio.publicar(usuarioId, solicitud(1)), CodigoError.SOAT_EXPIRES_BEFORE_DEPARTURE);
		verifyNoInteractions(viajeRepository);

		// Vence el mismo día de la salida: sigue vigente.
		existe(pasajero().vehiculo(vehiculo(EstadoVehiculo.ACTIVO, null, soatHasta(DIA_SALIDA))).build());
		servicio.publicar(usuarioId, solicitud(1));
		verify(viajeRepository).insert(any(Viaje.class));
	}

	@Test
	void listarPaginaDeAVeinteYAvisaSiHayMas() {
		existe(pasajero().build());
		List<Viaje> veintiuno = java.util.stream.IntStream.range(0, 21)
				.mapToObj(i -> Viajes.publicado(new ObjectId(), new ObjectId()).build()).toList();
		when(mongoTemplate.find(any(Query.class), eq(Viaje.class))).thenReturn(veintiuno);

		ListadoViajesDto listado = servicio.listar(usuarioId, new FiltroViajesRequest(null, null, null, null, null, "3"));

		assertThat(listado.data()).hasSize(20);
		assertThat(listado.hasMore()).isTrue();
		assertThat(listado.page()).isEqualTo(3);
		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(consulta.capture(), eq(Viaje.class));
		assertThat(consulta.getValue().getSkip()).isEqualTo(40);
		assertThat(consulta.getValue().getLimit()).isEqualTo(21);
	}

	@Test
	void listarInformaLaReservaActivaYElBloqueoDelPasajero() {
		existe(pasajero().build());
		when(mongoTemplate.find(any(Query.class), eq(Viaje.class))).thenReturn(List.of());
		ObjectId reservaId = new ObjectId();
		ObjectId viajeId = new ObjectId();
		Instant salida = Instant.parse("2030-01-15T19:20:00Z");
		when(restricciones.reservaActiva(usuarioId)).thenReturn(Optional.of(Reserva.builder().id(reservaId)
				.viajeId(viajeId).viaje(new Reserva.ResumenViaje("UTP Sede Trujillo", "Urb. El Golf", salida,
						"Carlos M.", null)).build()));
		Instant hasta = Instant.parse("2026-11-08T15:00:00Z");
		when(restricciones.bloqueo(eq(usuarioId), any(Instant.class)))
				.thenReturn(Optional.of(new CancelacionesConductorService.Bloqueo(5, 30, hasta)));

		ListadoViajesDto listado = servicio.listar(usuarioId, sinFiltros());

		assertThat(listado.activeBooking()).isEqualTo(new ListadoViajesDto.ReservaActivaDto(reservaId.toHexString(),
				viajeId.toHexString(), salida, "UTP Sede Trujillo", "Urb. El Golf"));
		assertThat(listado.bookingBlock()).isEqualTo(new PerfilUsuarioDto.BloqueoCancelacionesDto(5, hasta));
	}

	@Test
	void listarPropiosDevuelveLosViajesActivosDelConductor() {
		existe(conductor());
		when(mongoTemplate.find(any(Query.class), eq(Viaje.class)))
				.thenReturn(List.of(Viajes.publicado(new ObjectId(), usuarioId).build()));

		assertThat(servicio.listarPropios(usuarioId)).hasSize(1);

		ArgumentCaptor<Query> consulta = ArgumentCaptor.forClass(Query.class);
		verify(mongoTemplate).find(consulta.capture(), eq(Viaje.class));
		assertThat(consulta.getValue().getQueryObject()).containsEntry("conductor.id", usuarioId)
				.containsEntry("estado", new Document("$in", List.of(EstadoViaje.PUBLICADO, EstadoViaje.EN_CURSO)));
		assertThat(consulta.getValue().getSortObject()).isEqualTo(new Document("fecha_salida", 1));
	}

	@Test
	void unViajeInexistenteRespondeNotFound() {
		ObjectId viajeId = new ObjectId();
		when(viajeRepository.findById(viajeId)).thenReturn(Optional.empty());
		falla(() -> servicio.consultar(viajeId), CodigoError.RIDE_NOT_FOUND);
	}

	@Test
	void unaCuentaBloqueadaRespondeUnauthorized() {
		existe(pasajero().estado(EstadoUsuario.BLOQUEADO).build());

		falla(() -> servicio.listar(usuarioId, sinFiltros()),
				CodigoError.UNAUTHORIZED);
		falla(() -> servicio.publicar(usuarioId, solicitud(1)), CodigoError.UNAUTHORIZED);
	}
}
