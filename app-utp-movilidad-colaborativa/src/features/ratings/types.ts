// Calificar (P20): `RatingContext` y `Rating` en `docs/openapi.yaml`.

export type RatingTarget = {
  // Reserva del pasajero: es lo que se envía en POST /ratings.
  bookingId: string;
  userId: string;
  name: string;
  photoUrl: string | null;
  role: "DRIVER" | "PASSENGER";
  // Solo en pasajeros.
  seats: number | null;
  // Solo en el conductor.
  vehicle: { brand: string; model: string; color: string; plate: string } | null;
  rated: boolean;
};

/** Lo que necesita P20. `deadline` = fin del viaje + 24 h; `open` es `false` si ya venció. */
export type RatingContext = {
  ride: {
    id: string;
    departureTime: string;
    finishedAt: string | null;
    campus: { id: string; name: string; city: string | null } | null;
    origin: { label: string; address: string | null };
    destination: { label: string; address: string | null };
  };
  role: "DRIVER" | "PASSENGER";
  deadline: string | null;
  open: boolean;
  targets: RatingTarget[];
};

export type Rating = {
  id: string;
  rideId: string;
  bookingId: string;
  ratedUserId: string;
  ratedRole: "DRIVER" | "PASSENGER";
  score: number;
  comment: string | null;
  createdAt: string;
};
