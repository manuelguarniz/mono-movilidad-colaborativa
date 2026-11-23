import type { FunctionComponent, SVGProps } from "react";
import StarFilledIcon from "@/assets/images/icons/star-filled.svg?react";
import CarIcon from "@/assets/images/icons/car.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import SeatIcon from "@/assets/images/icons/seat.svg?react";
import CalendarXIcon from "@/assets/images/icons/calendar-x.svg?react";
import WarningIcon from "@/assets/images/icons/warning.svg?react";
import WalletIcon from "@/assets/images/icons/wallet.svg?react";
import { formatLimaTime } from "@/shared/utils/limaTime";
import type { AppNotification, NotificationType } from "@/features/notifications/types";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/** RN-47: se califica durante 24 h desde el fin del viaje, que es cuando llega la notificación. */
const RATING_WINDOW_MS = DAY_MS;

type Icon = FunctionComponent<SVGProps<SVGSVGElement>>;
type Tone = "amber" | "green" | "gray" | "red";

// Nombres completos: Tailwind solo conserva las clases que encuentra escritas en el código.
export const TONE_CLASS: Record<Tone, string> = {
  amber: "notification-icon-amber",
  green: "notification-icon-green",
  gray: "notification-icon-gray",
  red: "notification-icon-red",
};

/** Icono y color por tipo («Supuestos a validar» de P18). */
export const NOTIFICATION_STYLE: Record<NotificationType, { icon: Icon; tone: Tone }> = {
  VIAJE_COMPLETADO: { icon: StarFilledIcon, tone: "amber" },
  VIAJE_INICIADO: { icon: CarIcon, tone: "green" },
  RECORDATORIO_SALIDA: { icon: ClockIcon, tone: "gray" },
  NUEVA_RESERVA: { icon: SeatIcon, tone: "gray" },
  VIAJE_CANCELADO: { icon: CalendarXIcon, tone: "red" },
  RESERVA_CANCELADA: { icon: CalendarXIcon, tone: "red" },
  NO_SE_PRESENTO: { icon: WarningIcon, tone: "amber" },
  RETIRO_RECHAZADO: { icon: WalletIcon, tone: "red" },
};

/** Pantalla relacionada de cada tipo (RF-13). */
export function destinationOf(notification: AppNotification, now = Date.now()): string {
  switch (notification.type) {
    case "NUEVA_RESERVA":
    case "RESERVA_CANCELADA":
    case "RECORDATORIO_SALIDA":
    case "VIAJE_INICIADO":
      return "/mis-viajes";
    case "VIAJE_CANCELADO":
    case "NO_SE_PRESENTO":
      return "/historial";
    case "VIAJE_COMPLETADO":
      return notification.rideId && now - Date.parse(notification.createdAt) < RATING_WINDOW_MS
        ? `/calificar/${notification.rideId}`
        : "/historial";
    case "RETIRO_RECHAZADO":
      return "/billetera";
  }
}

// `en-CA` da AAAA-MM-DD en la hora de Perú: se compara como texto.
const limaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });
const dayMonth = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short" });

const dayKey = (date: Date | number) => limaDay.format(date);
const shortDate = (date: Date) => dayMonth.format(date).replace(".", "");

/** Grupo de la bandeja: «Hoy», «Ayer» o «28 oct». */
export function groupLabel(createdAt: string, now = Date.now()) {
  const date = new Date(createdAt);
  if (dayKey(date) === dayKey(now)) {
    return "Hoy";
  }
  if (dayKey(date) === dayKey(now - DAY_MS)) {
    return "Ayer";
  }
  return shortDate(date);
}

/**
 * Hace cuánto llegó: «Ahora», «Hace N min» hasta 59 min, «Hace N h» durante el mismo día,
 * «Ayer, HH:MM» y luego «28 oct, HH:MM».
 */
export function relativeTime(createdAt: string, now = Date.now()) {
  const date = new Date(createdAt);
  const elapsed = Math.max(0, now - date.getTime());
  if (elapsed < MINUTE_MS) {
    return "Ahora";
  }
  if (elapsed < HOUR_MS) {
    return `Hace ${Math.floor(elapsed / MINUTE_MS)} min`;
  }
  if (dayKey(date) === dayKey(now)) {
    return `Hace ${Math.floor(elapsed / HOUR_MS)} h`;
  }
  if (dayKey(date) === dayKey(now - DAY_MS)) {
    return `Ayer, ${formatLimaTime(date)}`;
  }
  return `${shortDate(date)}, ${formatLimaTime(date)}`;
}

/** Agrupa por día manteniendo el orden (la más reciente primero). */
export function groupByDay(items: AppNotification[], now = Date.now()) {
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const item of items) {
    const label = groupLabel(item.createdAt, now);
    const last = groups[groups.length - 1];
    if (last?.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

/** «9+» a partir de 10 (RF-13). */
export const badgeLabel = (count: number) => (count > 9 ? "9+" : String(count));
