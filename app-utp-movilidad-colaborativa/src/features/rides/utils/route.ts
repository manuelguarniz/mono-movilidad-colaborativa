import type { GeoPoint, RoutePoint } from "@/features/rides/types";

// Reglas de negocio de «Publicar viaje» (README, RN-10 a RN-13).
export const MAX_STOPS = 5;
export const MIN_PRICE = 1;
export const MAX_PRICE = 10;
export const MAX_CONDITIONS = 10;
export const MAX_CONDITION_LENGTH = 60;

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

/** Distancia con coma decimal, como se escribe en Perú: `5,2 km`. */
export const formatKm = (km: number) => `${km.toFixed(1).replace(".", ",")} km`;

const MIN_DEPARTURE_MINUTES = 6 * 60;
const MAX_DEPARTURE_MINUTES = 23 * 60;
const SLOT_MINUTES = 30;

/** Fecha en la hora de Perú, leída con los métodos `getUTC*`. */
const toLimaClock = (date: Date) => new Date(date.getTime() - LIMA_OFFSET_MS);

const pad = (value: number) => String(value).padStart(2, "0");

/** Valor de un `<input type="datetime-local">` (`AAAA-MM-DDTHH:mm`) en la hora de Perú. */
export function toLimaInputValue(date: Date) {
  const lima = toLimaClock(date);
  return `${lima.getUTCFullYear()}-${pad(lima.getUTCMonth() + 1)}-${pad(lima.getUTCDate())}T${pad(lima.getUTCHours())}:${pad(lima.getUTCMinutes())}`;
}

/** Inversa de `toLimaInputValue`; `null` si el valor está vacío o no es válido. */
export function fromLimaInputValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day, hours, minutes] = match.slice(1).map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) + LIMA_OFFSET_MS);
}

/** La salida es futura y su hora está entre las 06:00 y las 23:00 de Perú (RN-12). */
export function isDepartureValid(date: Date) {
  const lima = toLimaClock(date);
  const minutes = lima.getUTCHours() * 60 + lima.getUTCMinutes();
  return (
    date.getTime() > Date.now() &&
    minutes >= MIN_DEPARTURE_MINUTES &&
    minutes <= MAX_DEPARTURE_MINUTES
  );
}

/** Próxima media hora disponible dentro del horario permitido. */
export function getDefaultDeparture() {
  const now = Date.now();
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const slot = new Date(Math.ceil((now + 1) / slotMs) * slotMs);
  if (isDepartureValid(slot)) {
    return slot;
  }
  // Fuera de horario: la primera salida del día siguiente (o de hoy, si aún no son las 6).
  const lima = toLimaClock(slot);
  const dayOffset = lima.getUTCHours() * 60 + lima.getUTCMinutes() > MAX_DEPARTURE_MINUTES ? 1 : 0;
  return new Date(
    Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate() + dayOffset, 6) +
      LIMA_OFFSET_MS,
  );
}

const shortDayFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** `07:00`, en 24 h y hora de Perú. */
export function formatDepartureTime(date: Date) {
  const lima = toLimaClock(date);
  return `${pad(lima.getUTCHours())}:${pad(lima.getUTCMinutes())}`;
}

/** «Hoy, jue 29 oct», «Mañana, vie 30 oct» o «Sáb 31 oct». */
export function formatDepartureDay(date: Date) {
  const parts = shortDayFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    (parts.find((item) => item.type === type)?.value ?? "").replace(".", "");
  const day = `${part("weekday")} ${part("day")} ${part("month")}`;

  const dayKey = (value: Date) => toLimaClock(value).toISOString().slice(0, 10);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + DAY_MS);
  if (dayKey(date) === dayKey(today)) {
    return `Hoy, ${day}`;
  }
  if (dayKey(date) === dayKey(tomorrow)) {
    return `Mañana, ${day}`;
  }
  return day.charAt(0).toUpperCase() + day.slice(1);
}

let lastPointId = 0;

export function createRoutePoint(label: string, location: GeoPoint): RoutePoint {
  lastPointId += 1;
  return { id: `point-${lastPointId}`, label, location };
}
