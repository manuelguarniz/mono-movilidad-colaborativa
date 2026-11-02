import type { RideSummary } from "@/features/dashboard/types";

// Tipos del contrato `docs/openapi.yaml` que usa Mis viajes (P17).

// `CancellationCounter`: cancelaciones del conductor (RN-30) o del pasajero (RN-38) en la ventana.
export type CancellationCounter = {
  count: number;
  limit: number;
  windowDays: number;
  // Bloqueo actual; `null` si no está bloqueado.
  blockedUntil: string | null;
  // Bloqueo que tendría con una cancelación más ahora (advertencia de 17-D).
  blockedUntilIfCancelled: string | null;
};

// `OwnBooking`: reserva del pasajero con el viaje.
export type OwnBooking = {
  id: string;
  status: "CONFIRMED" | "IN_RIDE" | "CANCELLED";
  // Solo en las canceladas por el conductor o el sistema.
  cancelledBy: "DRIVER" | "SYSTEM" | null;
  seats: number;
  // Créditos retenidos: plazas × precio por plaza.
  totalCredits: number;
  // Salida menos `minutos_limite_cancelacion` (RN-25).
  cancellableUntil: string;
  ride: RideSummary;
};

// GET /bookings/mine.
export type MyBookings = {
  active: OwnBooking | null;
  // Canceladas por el conductor o el sistema en las últimas 24 h.
  cancelled: OwnBooking[];
  cancellations: CancellationCounter;
};

// `RidePassenger`. La asistencia de movilidad (RN-22) llegará cuando el perfil la guarde.
export type RidePassenger = {
  bookingId: string;
  id: string;
  name: string;
  photoUrl: string | null;
  rating: { average: number; count: number } | null;
  seats: number;
  totalCredits: number;
  status: "CONFIRMED" | "IN_RIDE" | "NO_SHOW";
};

// `DriverRide`: viaje del conductor con sus reservas y sus plazos (RN-26, RN-43).
export type DriverRide = {
  ride: RideSummary;
  passengers: RidePassenger[];
  cancellableUntil: string;
  startableFrom: string;
  startableUntil: string;
};

// GET /rides/mine.
export type MyDriverRides = {
  data: DriverRide[];
  cancellations: CancellationCounter;
};
