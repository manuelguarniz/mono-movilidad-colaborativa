// Historial (P19): `HistoryPage` y `HistoryEntry` en `docs/openapi.yaml`.

export type HistoryRole = "PASSENGER" | "DRIVER";
export type HistoryActor = "PASSENGER" | "DRIVER" | "SYSTEM";

export type HistoryPerson = { id: string | null; name: string; photoUrl: string | null };

export type HistoryPassenger = {
  bookingId: string;
  id: string;
  name: string;
  photoUrl: string | null;
  seats: number;
};

/**
 * Calificación de un viaje completado (RN-47). `deadline` = fin del viaje + 24 h; `open` es
 * `false` si ya venció. `pending` es a cuántas personas falta calificar; `given`, las ya
 * calificadas con su puntaje (sin comentario).
 */
export type HistoryRating = {
  deadline: string | null;
  open: boolean;
  pending: number;
  given: { userId: string; name: string; score: number }[];
};

/**
 * Viaje terminado. Como pasajero, `id` es la reserva; como conductor, el viaje.
 * `credits`: como pasajero, lo pagado (COMPLETED), devuelto (CANCELLED) o pagado al
 * conductor (NO_SHOW); como conductor, lo cobrado. `rating` solo en viajes completados.
 */
export type HistoryEntry = {
  id: string;
  rideId: string;
  role: HistoryRole;
  status: "COMPLETED" | "CANCELLED" | "NO_SHOW";
  cancelledBy: HistoryActor | null;
  departureTime: string;
  finishedAt: string | null;
  campus: { id: string; name: string; city: string | null } | null;
  origin: { label: string; address: string | null };
  destination: { label: string; address: string | null };
  credits: number;
  // Solo como pasajero.
  seats: number | null;
  driver: (HistoryPerson & { rating: { average: number; count: number } | null }) | null;
  vehicle: { brand: string; model: string; color: string; plate: string } | null;
  // Solo como conductor: los que subieron, los ausentes y las reservas reembolsadas.
  passengers: HistoryPassenger[] | null;
  noShows: number | null;
  refundedBookings: number | null;
  rating: HistoryRating | null;
};

export type HistoryPage = { data: HistoryEntry[]; page: number; hasMore: boolean };
