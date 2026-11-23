import type { GeoPoint, PublishLimits, RoutePoint } from "@/features/rides/types";

// Reglas de negocio de «Publicar viaje» (README, RN-10 a RN-13). Los límites configurables llegan de
// GET /rides/publish-limits (colección app, RN-31); el largo de la condición es fijo.
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

/** `"06:30"` → minutos desde la medianoche. */
const clockToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * La salida es futura y su hora de Perú está entre `departureFrom` y `departureTo`, ambas incluidas (RN-12).
 * Si `departureFrom` es posterior a `departureTo`, el horario cruza la medianoche.
 */
export function isDepartureValid(date: Date, limits: PublishLimits) {
  if (date.getTime() <= Date.now()) {
    return false;
  }
  const lima = toLimaClock(date);
  const minutes = lima.getUTCHours() * 60 + lima.getUTCMinutes();
  const from = clockToMinutes(limits.departureFrom);
  const to = clockToMinutes(limits.departureTo);
  return from <= to
    ? minutes >= from && minutes <= to
    : minutes >= from || minutes <= to;
}

/** Próxima media hora disponible dentro del horario permitido. */
export function getDefaultDeparture(limits: PublishLimits) {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  const first = new Date(Math.ceil((Date.now() + 1) / slotMs) * slotMs);
  // Fuera de horario se avanza de media en media hora, como mucho un día.
  for (let slot = first; slot.getTime() - first.getTime() <= DAY_MS; ) {
    if (isDepartureValid(slot, limits)) {
      return slot;
    }
    slot = new Date(slot.getTime() + slotMs);
  }
  return first;
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
