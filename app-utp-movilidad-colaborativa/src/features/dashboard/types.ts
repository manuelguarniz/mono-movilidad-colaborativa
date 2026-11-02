// Viaje del listado del dashboard: `RideSummary` en `docs/openapi.yaml`.
export type RideSummary = {
  id: string;
  status: "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  direction: "TO_CAMPUS" | "TO_HOME";
  // ISO 8601 en UTC; se muestra en la hora de Perú.
  departureTime: string;
  // Aporte por plaza, en créditos.
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  distanceKm: number;
  durationMin: number;
  driver: {
    id: string;
    name: string;
    photoUrl: string | null;
    rating: { average: number; count: number } | null;
  };
  vehicle: {
    brand: string;
    model: string;
    color: string;
    plate: string;
    // RN-18 y RN-36: copias del vehículo al publicar.
    wheelchairAccessible: boolean;
    soatEndDate: string | null;
  };
  conditions: string[];
  origin: RidePlaceSummary;
  destination: RidePlaceSummary;
  // Sede del conductor; `city` es la etiqueta del dashboard (RN-49), `null` en viajes antiguos.
  campus: { id: string; name: string; city: string | null } | null;
  // Hora de inicio (RN-43); `null` mientras el viaje no se inicia.
  startedAt?: string | null;
};

// Lo que impide reservar: el motivo se muestra una sola vez, arriba del listado.
export type CancellationBlock = { count: number; until: string };

// Reserva activa del pasajero (RN-23).
export type ActiveBooking = {
  id: string;
  rideId: string;
  departureTime: string;
  origin: string;
  destination: string;
};

// Página de GET /rides: 20 viajes, con la reserva activa (RN-23) y el bloqueo (RN-38).
export type RidePage = {
  data: RideSummary[];
  page: number;
  hasMore: boolean;
  activeBooking: ActiveBooking | null;
  bookingBlock: CancellationBlock | null;
};

export type RidePlaceSummary = {
  label: string;
  address: string | null;
};

// Filtros del listado (RF-03). Sin sede: se listan todas (RN-49).
export type RideSearchFilters = {
  destination: string;
  // Hora de salida mínima, `HH:mm` de 24 horas y hora de Perú; `null` para cualquier hora.
  time: string | null;
  passengers: number;
  // Solo vehículos aptos para silla de ruedas plegable (RN-19).
  accessible: boolean;
};

// Lo que el encabezado usa de `UserProfile` (GET /users/me).
export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  activeMode: "PASSENGER" | "DRIVER" | null;
  // Bloqueo del conductor para publicar (RN-30).
  cancellationBlock: CancellationBlock | null;
};
