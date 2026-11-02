import type { RidePlaceSummary } from "@/features/dashboard/types";

type TripRouteProps = {
  origin: RidePlaceSummary;
  destination: RidePlaceSummary;
  // 17-A: etiquetas arriba de cada lugar; 17-B: etiquetas a la derecha y solo el nombre.
  variant?: "stacked" | "inline";
};

/** «Campus UTP Trujillo — Av. Nicolás de Piérola 1221». */
const placeText = (place: RidePlaceSummary) =>
  place.address ? `${place.label} — ${place.address}` : place.label;

/** Origen y destino unidos por una línea (frames 17-A y 17-B). */
export function TripRoute({ origin, destination, variant = "stacked" }: TripRouteProps) {
  const isInline = variant === "inline";
  return (
    <ol className="my-rides-route">
      <li className="my-rides-route-item">
        <span className="my-rides-route-dot border-2 border-[var(--brand-red)] bg-white" />
        {isInline ? (
          <div className="flex items-start justify-between gap-3">
            <p className="text-[0.9375rem] text-[var(--text-primary)]">{placeText(origin)}</p>
            <span className="shrink-0 text-xs text-[var(--text-muted)]">Origen</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--text-muted)]">Origen</p>
            <p className="text-[0.9375rem] text-[var(--text-primary)]">{placeText(origin)}</p>
          </>
        )}
      </li>
      <li className="my-rides-route-item">
        <span className="my-rides-route-dot bg-[var(--brand-red)]" />
        {isInline ? (
          <div className="flex items-start justify-between gap-3">
            <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              {placeText(destination)}
            </p>
            <span className="shrink-0 text-xs text-[var(--brand-red)]">Destino</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--brand-red)]">Destino</p>
            <p className="text-[0.9375rem] text-[var(--text-primary)]">{placeText(destination)}</p>
          </>
        )}
      </li>
    </ol>
  );
}
