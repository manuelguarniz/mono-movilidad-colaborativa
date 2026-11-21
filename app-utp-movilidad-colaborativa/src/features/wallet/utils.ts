import type { MovementType } from "@/features/wallet/types";

const LIMA = "America/Lima";
const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: LIMA });
const dayMonth = new Intl.DateTimeFormat("es-PE", { timeZone: LIMA, day: "numeric", month: "short" });

/** Título de cada tipo de movimiento (P21, «Supuestos a validar»). */
export const MOVEMENT_TITLE: Record<MovementType, string> = {
  TOP_UP: "Recarga con Yape",
  BOOKING_HOLD: "Reserva de viaje",
  REFUND: "Reembolso",
  RIDE_EARNING: "Cobro de viaje",
  WITHDRAWAL: "Retiro a Yape",
  WITHDRAWAL_REVERSAL: "Retiro devuelto",
};

/** Clave del día en la hora de Perú, para agrupar los movimientos. */
export const limaDay = (date: Date) => dayKey.format(date);

/** «Hoy», «Ayer» o «26 oct». */
export function formatMovementDay(date: Date, now = Date.now()) {
  const day = limaDay(date);
  if (day === dayKey.format(now)) {
    return "Hoy";
  }
  if (day === dayKey.format(now - DAY_MS)) {
    return "Ayer";
  }
  return dayMonth.format(date).replace(".", "");
}

/** «+9» o «−50» (signo menos tipográfico). */
export const signedCredits = (amount: number) =>
  amount > 0 ? `+${amount}` : `−${Math.abs(amount)}`;

/** «987 654 321». */
export const formatPhone = (digits: string) =>
  digits.replace(/\D/g, "").slice(0, 9).replace(/(\d{3})(?=\d)/g, "$1 ");
