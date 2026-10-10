import type { RideSummary } from "@/features/dashboard/types";

// Tipos del contrato `docs/openapi.yaml` que usan la publicación y el detalle de viajes.

export type GeoPoint = { lat: number; lng: number };

export type Place = {
  label: string;
  address?: string | null;
  location: GeoPoint;
};

export type RideDirection = "TO_CAMPUS" | "TO_HOME";

// `RideCreateRequest`. El backend toma del usuario el conductor, el vehículo y la sede,
// y calcula la distancia y la duración.
export type RideCreateRequest = {
  direction: RideDirection;
  // ISO 8601 en UTC.
  departureTime: string;
  origin: Place;
  destination: Place;
  stops: Place[];
  // Créditos por plaza, de 1 a 10 (1 crédito = 1 sol).
  pricePerSeat: number;
  seats: number;
  conditions: string[];
};

// `RideDetail` (GET /rides/{rideId}): el viaje con la ruta completa para el mapa.
export type RideDetail = Omit<RideSummary, "origin" | "destination"> & {
  origin: Place;
  destination: Place;
  // Paradas intermedias, en el orden del recorrido.
  stops: Place[];
  createdAt: string;
};

export type PublishedRide = {
  id: string;
  departureTime: string;
};

// Lo que la pantalla usa de `Vehicle` (GET /vehicles/me).
export type MyVehicle = {
  brand: string;
  model: string;
  plate: string;
  // Plazas que el conductor comparte, sin contar la suya.
  seats: number;
};

// Lo que la pantalla usa de `UserProfile` (GET /users/me).
export type MyProfile = {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  district: { id: string; name: string } | null;
  campus: { id: string; name: string; address: string } | null;
  homeAddress: Place | null;
};

// `Campus` (GET /catalogs/campuses).
export type Campus = {
  id: string;
  name: string;
  address?: string | null;
  location?: GeoPoint | null;
};

/** Punto que el conductor marca en el mapa: su casa o una parada. */
export type RoutePoint = {
  id: string;
  label: string;
  location: GeoPoint;
};
