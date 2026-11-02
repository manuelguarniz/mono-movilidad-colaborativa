import { useEffect, useRef, useState } from "react";
import type { FilterField } from "@/features/dashboard/components/RideSearchBar";
import type { RideSearchFilters } from "@/features/dashboard/types";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";

type RideFiltersSheetProps = {
  filters: RideSearchFilters;
  // Campo que se enfoca al abrir (desde los chips «Desde…» y «N pasajero»).
  focusField?: FilterField;
  onApply: (filters: RideSearchFilters) => void;
  onClear: () => void;
  onClose: () => void;
};

const MIN_PASSENGERS = 1;
const MAX_PASSENGERS = 10;

// De 06:00 a 23:00 cada 30 minutos (RF-03).
const TIME_OPTIONS = Array.from({ length: 35 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 === 0 ? "00" : "30"}`;
});

/** Hoja inferior de filtros del dashboard (frame 06-D). */
export function RideFiltersSheet({
  filters,
  focusField,
  onApply,
  onClear,
  onClose,
}: RideFiltersSheetProps) {
  const [draft, setDraft] = useState(filters);
  const destinationRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLSelectElement>(null);
  const passengersRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const target =
      focusField === "time"
        ? timeRef.current
        : focusField === "passengers"
          ? passengersRef.current
          : destinationRef.current;
    target?.focus();
  }, [focusField]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const setPassengers = (passengers: number) =>
    setDraft({
      ...draft,
      passengers: Math.min(MAX_PASSENGERS, Math.max(MIN_PASSENGERS, passengers)),
    });

  return (
    <div
      className="app-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ride-filters-title"
      onClick={onClose}
    >
      <form
        className="app-sheet"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onApply({ ...draft, destination: draft.destination.trim() });
        }}
      >
        <span className="publish-sheet-handle block" aria-hidden="true" />

        <div className="mt-3 flex items-center justify-between border-b border-[var(--border-neutral)] pb-3">
          <h2 id="ride-filters-title" className="text-xl font-semibold text-[var(--text-primary)]">
            Filtros
          </h2>
          <button
            type="button"
            className="publish-icon-button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="filter-destination" className="filter-label">
              Destino
            </label>
            <div className="filter-field">
              <span className="ride-destination-dot" aria-hidden="true" />
              <input
                ref={destinationRef}
                id="filter-destination"
                type="text"
                value={draft.destination}
                maxLength={100}
                placeholder="¿A dónde vas?"
                className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-[var(--text-primary)] outline-none placeholder:text-[#686c75]"
                onChange={(event) => setDraft({ ...draft, destination: event.target.value })}
              />
            </div>
            <p className="filter-help">Busca por el nombre del lugar</p>
          </div>

          <div>
            <label htmlFor="filter-time" className="filter-label">
              Salir desde las
            </label>
            <div className="filter-field">
              <ClockIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
              <select
                ref={timeRef}
                id="filter-time"
                value={draft.time ?? ""}
                className="min-w-0 flex-1 bg-transparent text-[0.9375rem] tabular-nums text-[var(--text-primary)] outline-none"
                onChange={(event) => setDraft({ ...draft, time: event.target.value || null })}
              >
                <option value="">Cualquier hora</option>
                {/* La hora por defecto («Desde HH:00») puede no estar en la lista de medias horas. */}
                {draft.time && !TIME_OPTIONS.includes(draft.time) ? (
                  <option value={draft.time}>{draft.time}</option>
                ) : null}
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <p className="filter-help">De 06:00 a 23:00. Solo viajes de hoy desde esa hora.</p>
          </div>

          <div>
            <p className="filter-label" id="filter-passengers-label">
              Pasajeros
            </p>
            <div
              className="filter-field justify-between"
              role="group"
              aria-labelledby="filter-passengers-label"
            >
              <span className="text-[0.9375rem] text-[var(--text-muted)]">Plazas requeridas</span>
              <div className="flex items-center gap-3">
                <button
                  ref={passengersRef}
                  type="button"
                  className="publish-stepper-button"
                  aria-label="Menos pasajeros"
                  disabled={draft.passengers <= MIN_PASSENGERS}
                  onClick={() => setPassengers(draft.passengers - 1)}
                >
                  −
                </button>
                <span className="w-5 text-center text-lg font-semibold tabular-nums" aria-live="polite">
                  {draft.passengers}
                </span>
                <button
                  type="button"
                  className="publish-stepper-button"
                  aria-label="Más pasajeros"
                  disabled={draft.passengers >= MAX_PASSENGERS}
                  onClick={() => setPassengers(draft.passengers + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <p className="filter-help">Solo viajes con al menos esa cantidad de asientos libres</p>
          </div>

          <label className="flex items-center gap-3 border-t border-[var(--border-neutral)] pt-4">
            <AccessibleIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-medium text-[var(--text-primary)]">
                Solo vehículos accesibles
              </span>
              <span className="block text-sm text-[var(--text-muted)]">
                Aptos para silla de ruedas plegable
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={draft.accessible}
              className="filter-switch"
              onChange={(event) => setDraft({ ...draft, accessible: event.target.checked })}
            />
          </label>
        </div>

        <button type="submit" className="publish-submit mt-6">
          Aplicar filtros
        </button>
        <button
          type="button"
          className="mt-2 w-full py-2 text-center text-base font-semibold text-[var(--brand-red)]"
          onClick={onClear}
        >
          Limpiar filtros
        </button>
      </form>
    </div>
  );
}
