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
  };
  conditions: string[];
  origin: RidePlaceSummary;
  destination: RidePlaceSummary;
};

export type RidePlaceSummary = {
  label: string;
  address: string | null;
};

export type RideSearchFilters = {
  campusId?: string;
  destination?: string;
  // Hora de salida mínima, `HH:mm` de 24 horas y hora de Perú.
  time?: string;
  passengers?: number;
};

// Lo que el encabezado usa de `UserProfile` (GET /users/me).
export type CurrentUser = {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
};
