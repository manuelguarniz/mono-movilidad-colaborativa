import { formatLimaTime, getLimaDayLabel } from "@/shared/utils/limaTime";

const LIMA = "America/Lima";
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: LIMA });
const shortDay = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const monthYear = new Intl.DateTimeFormat("es-PE", { timeZone: LIMA, month: "long", year: "numeric" });

const clean = (value: string) => value.replace(/\./g, "").replace(",", "");
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** «Hoy, 29 oct · 14:20», «Ayer, 28 oct · 18:00» o «Lun 26 oct · 08:00» (19-A). */
export function formatHistoryDate(date: Date, now = Date.now()) {
  const parts = shortDay.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    clean(parts.find((item) => item.type === type)?.value ?? "");
  const dayMonth = `${part("day")} ${part("month")}`;
  const time = formatLimaTime(date);
  const day = dayKey.format(date);
  if (day === dayKey.format(now)) {
    return `Hoy, ${dayMonth} · ${time}`;
  }
  if (day === dayKey.format(now - DAY_MS)) {
    return `Ayer, ${dayMonth} · ${time}`;
  }
  return `${capitalize(part("weekday"))} ${dayMonth} · ${time}`;
}

/** «de hoy», «de ayer» o «del lun 26 oct»: «Calificaste a Carlos M. por tu viaje de hoy.» (20-C). */
export function formatTripDay(date: Date, now = Date.now()) {
  const [day] = formatHistoryDate(date, now).split(" · ");
  if (day.startsWith("Hoy")) {
    return "de hoy";
  }
  if (day.startsWith("Ayer")) {
    return "de ayer";
  }
  return `del ${day.charAt(0).toLowerCase()}${day.slice(1)}`;
}

/** Clave y etiqueta del mes en la hora de Perú: «OCTUBRE 2026». */
export function monthGroup(date: Date) {
  return {
    key: dayKey.format(date).slice(0, 7),
    label: monthYear.format(date).replace(" de ", " ").toUpperCase(),
  };
}

/** «hoy, 14:50» o «mañana, 14:50»: el plazo de calificación es de 24 h (RN-47). */
export function formatDeadline(date: Date) {
  return `${getLimaDayLabel(date)}, ${formatLimaTime(date)}`;
}

export const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;
