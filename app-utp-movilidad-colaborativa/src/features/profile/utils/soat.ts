import type { Soat } from "@/features/vehicles/types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** RF-14: el perfil avisa cuando faltan 15 días o menos para el fin del SOAT. */
export const SOAT_WARNING_DAYS = 15;

// `en-CA` da la fecha como AAAA-MM-DD en la hora de Perú.
const limaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });

export type SoatState =
  | { kind: "valid"; daysLeft: number }
  | { kind: "expiring"; daysLeft: number }
  | { kind: "expired"; daysLeft: number };

/** Días que faltan para `soat.endDate` (fecha de Perú), contados desde hoy en Perú. */
export function getSoatState(soat: Pick<Soat, "endDate">, now = Date.now()): SoatState {
  const today = Date.parse(limaDay.format(now));
  const daysLeft = Math.round((Date.parse(soat.endDate) - today) / DAY_MS);
  if (daysLeft < 0) {
    return { kind: "expired", daysLeft };
  }
  return { kind: daysLeft <= SOAT_WARNING_DAYS ? "expiring" : "valid", daysLeft };
}

/** Hoy en Perú como `AAAA-MM-DD`. */
export const limaToday = (now = Date.now()) => limaDay.format(now);

/** `AAAA-MM-DD` → `DD/MM/AAAA`, sin pasar por zonas horarias. */
export const formatSoatDate = (date: string) => date.split("-").reverse().join("/");

/** `AAAA-MM-DD` → `DD/MM`. */
export const formatSoatDayMonth = (date: string) => formatSoatDate(date).slice(0, 5);

export function soatChipLabel(state: SoatState) {
  if (state.kind === "expired") {
    return "SOAT vencido";
  }
  if (state.kind === "valid") {
    return "SOAT vigente";
  }
  if (state.daysLeft === 0) {
    return "Vence hoy";
  }
  return `Vence en ${state.daysLeft} ${state.daysLeft === 1 ? "día" : "días"}`;
}
