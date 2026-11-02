import { ApiError } from "@/shared/api/apiClient";

const MINUTE_MS = 60 * 1000;

export const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

/** «Sale en 1 h 05 min» o «Sale en 12 min»; `null` si ya pasó la hora. */
export function formatCountdown(departure: Date, now = Date.now()) {
  const minutes = Math.ceil((departure.getTime() - now) / MINUTE_MS);
  if (minutes <= 0) {
    return null;
  }
  if (minutes < 60) {
    return `Sale en ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return `Sale en ${hours} h ${String(minutes % 60).padStart(2, "0")} min`;
}

/** Llegada estimada: inicio (o salida) más la duración del viaje. */
export const estimatedArrival = (start: Date, durationMin: number) =>
  new Date(start.getTime() + durationMin * MINUTE_MS);

/** El mensaje de la API, o uno genérico si no llegó respuesta. */
export const errorMessage = (error: unknown) =>
  error instanceof ApiError || error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado. Inténtalo nuevamente.";
