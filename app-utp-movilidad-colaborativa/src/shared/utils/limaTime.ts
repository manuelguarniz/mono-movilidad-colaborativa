// La API entrega las fechas en UTC; la app las muestra en la hora de Perú.
const LIMA = "America/Lima";
const DAY_MS = 24 * 60 * 60 * 1000;

const time24Formatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const time12Formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: LIMA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const weekdayFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  weekday: "long",
});

// `en-CA` da la fecha como AAAA-MM-DD, que se puede comparar como texto.
const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: LIMA });

/** `14:15`. */
export const formatLimaTime = (date: Date) => time24Formatter.format(date);

/** `02:15 PM`. */
export const formatLimaTime12h = (date: Date) => time12Formatter.format(date);

/** Día en la hora de Perú: «hoy», «mañana» o el día de la semana. */
export function getLimaDayLabel(date: Date) {
  const day = dayFormatter.format(date);
  const now = Date.now();
  if (day === dayFormatter.format(now)) {
    return "hoy";
  }
  if (day === dayFormatter.format(now + DAY_MS)) {
    return "mañana";
  }
  return weekdayFormatter.format(date);
}

/** «Hoy, 14:20», «Mañana, 07:00» o «Viernes, 07:00». */
export function formatDepartureLabel(date: Date) {
  const day = getLimaDayLabel(date);
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${formatLimaTime(date)}`;
}

/** `DD/MM` en la hora de Perú. */
export const formatLimaDayMonth = (date: Date) =>
  new Intl.DateTimeFormat("es-PE", { timeZone: LIMA, day: "2-digit", month: "2-digit" }).format(date);
