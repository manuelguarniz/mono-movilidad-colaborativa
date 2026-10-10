import type { GeoPoint, RoutePoint } from "@/features/rides/types";

// Reglas de negocio de «Publicar viaje» (README, RN-11 a RN-13).
export const MAX_STOPS = 5;
export const MIN_PRICE = 1;
export const MAX_PRICE = 10;
export const MIN_DEPARTURE = "06:00";
export const MAX_DEPARTURE = "23:00";

// Perú no tiene horario de verano: siempre UTC-5.
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const AVERAGE_SPEED_KMH = 35;

function distanceBetween(a: GeoPoint, b: GeoPoint) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Distancia en línea recta entre los puntos y duración estimada a 35 km/h. Es el mismo
 * cálculo del backend, que es quien guarda los valores definitivos.
 */
export function measureRoute(points: GeoPoint[]) {
  let km = 0;
  for (let i = 1; i < points.length; i += 1) {
    km += distanceBetween(points[i - 1], points[i]);
  }
  return {
    distanceKm: Math.round(km * 10) / 10,
    durationMin: Math.max(1, Math.round((km / AVERAGE_SPEED_KMH) * 60)),
  };
}

/**
 * Inserta una parada donde menos alarga el recorrido. `route` va de la casa a la sede e
 * incluye ambos extremos; devuelve la posición entre las paradas.
 */
export function findStopPosition(route: GeoPoint[], stop: GeoPoint) {
  let best = 0;
  let bestDetour = Infinity;
  for (let i = 0; i < route.length - 1; i += 1) {
    const detour =
      distanceBetween(route[i], stop) +
      distanceBetween(stop, route[i + 1]) -
      distanceBetween(route[i], route[i + 1]);
    if (detour < bestDetour) {
      bestDetour = detour;
      best = i;
    }
  }
  return best;
}

export const isDepartureInRange = (time: string) =>
  time >= MIN_DEPARTURE && time <= MAX_DEPARTURE;

/**
 * Próxima salida a esa hora de Perú (`HH:mm`): hoy si todavía no pasa, si no mañana.
 * La API recibe la fecha en UTC.
 */
export function buildDeparture(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const limaNow = new Date(Date.now() - LIMA_OFFSET_MS);
  const today =
    Date.UTC(
      limaNow.getUTCFullYear(),
      limaNow.getUTCMonth(),
      limaNow.getUTCDate(),
      hours,
      minutes,
    ) + LIMA_OFFSET_MS;
  const isToday = today > Date.now();

  return {
    date: new Date(isToday ? today : today + DAY_MS),
    day: isToday ? "hoy" : "mañana",
  };
}

/** `07:30` → `07:30 AM`. */
export function formatTime12h(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

let lastPointId = 0;

export function createRoutePoint(label: string, location: GeoPoint): RoutePoint {
  lastPointId += 1;
  return { id: `point-${lastPointId}`, label, location };
}
