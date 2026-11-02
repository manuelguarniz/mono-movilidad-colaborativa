import { useEffect, useState } from "react";
import type { RideSearchFilters } from "@/features/dashboard/types";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import PassengerIcon from "@/assets/images/icons/passenger.svg?react";
import TuneIcon from "@/assets/images/icons/tune.svg?react";

export type FilterField = "destination" | "time" | "passengers";

type RideSearchBarProps = {
  filters: RideSearchFilters;
  // Algún filtro distinto del valor por defecto: «Filtros» lleva un punto rojo.
  hasActiveFilters: boolean;
  onDestinationChange: (destination: string) => void;
  // Abre la hoja de filtros, con el campo indicado enfocado.
  onOpenFilters: (field?: FilterField) => void;
};

const SEARCH_DELAY_MS = 400;

/** Buscador de destino y chips de filtro del dashboard (RF-03, frames 06-A y 06-E). */
export function RideSearchBar({
  filters,
  hasActiveFilters,
  onDestinationChange,
  onOpenFilters,
}: RideSearchBarProps) {
  // El texto se aplica al dejar de escribir, para no pedir una página por cada letra.
  const [draft, setDraft] = useState(filters.destination);

  useEffect(() => {
    setDraft(filters.destination);
  }, [filters.destination]);

  useEffect(() => {
    if (draft === filters.destination) {
      return;
    }
    const timer = window.setTimeout(() => onDestinationChange(draft), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft, filters.destination, onDestinationChange]);

  const chipClass = (isActive: boolean) =>
    isActive ? "ride-filter-chip ride-filter-chip-active" : "ride-filter-chip";

  const chips = [
    {
      id: "time",
      field: "time" as const,
      isActive: filters.time !== null,
      isVisible: true,
      icon: <ClockIcon className="h-4 w-4" />,
      label: filters.time ? `Desde ${filters.time}` : "Cualquier hora",
    },
    {
      id: "passengers",
      field: "passengers" as const,
      isActive: filters.passengers > 1,
      isVisible: true,
      icon: <PassengerIcon className="h-4 w-4" />,
      label: `${filters.passengers} ${filters.passengers === 1 ? "pasajero" : "pasajeros"}`,
    },
    {
      id: "accessible",
      field: undefined,
      isActive: true,
      isVisible: filters.accessible,
      icon: <AccessibleIcon className="h-4 w-4" />,
      label: "Accesibles",
    },
  ];

  return (
    <section className="ride-search-card">
      <label className="ride-destination-field">
        <span className="ride-destination-dot" aria-hidden="true" />
        <input
          type="search"
          value={draft}
          maxLength={100}
          placeholder="¿A dónde vas?"
          aria-label="Destino"
          className="ride-destination-input"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onDestinationChange(draft);
            }
          }}
        />
      </label>

      {/* «Filtros» queda fijo a la derecha para que su punto siempre se vea. */}
      <div className="mt-3 flex items-center gap-2">
        <div className="ride-filter-row">
          {chips
            .filter((chip) => chip.isVisible)
            // Los chips activos van primero para que se vean sin desplazar la fila.
            .sort((a, b) => Number(b.isActive) - Number(a.isActive))
            .map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={chipClass(chip.isActive)}
                onClick={() => onOpenFilters(chip.field)}
              >
                {chip.icon}
                {chip.label}
              </button>
            ))}
        </div>

        <button
          type="button"
          className="ride-filter-chip relative shrink-0"
          aria-label={hasActiveFilters ? "Filtros (hay filtros aplicados)" : "Filtros"}
          onClick={() => onOpenFilters()}
        >
          <TuneIcon className="h-4 w-4" />
          Filtros
          {hasActiveFilters ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--accent-red)]"
              aria-hidden="true"
            />
          ) : null}
        </button>
      </div>
    </section>
  );
}
