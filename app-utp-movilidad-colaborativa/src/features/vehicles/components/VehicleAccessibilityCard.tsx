import type { VehicleAccessibility } from "@/features/vehicles/types";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";

/**
 * «ACCESIBILIDAD (OPCIONAL)» de P05 y P16 (RN-18). Con tipo Moto la pantalla no la muestra
 * (decisión del usuario del 2026-11-01, 16-C).
 */
export function VehicleAccessibilityCard({
  value,
  onChange,
}: {
  value: VehicleAccessibility;
  onChange: (next: VehicleAccessibility) => void;
}) {
  return (
    <section className="form-card">
      <p className="form-card-label">
        <AccessibleIcon className="h-5 w-5" aria-hidden="true" />
        Accesibilidad (opcional)
      </p>

      <label className="form-check-option mb-0 mt-3">
        <input
          type="checkbox"
          className="app-checkbox form-checkbox"
          checked={value.wheelchair}
          onChange={(event) => onChange({ ...value, wheelchair: event.target.checked })}
        />
        <span>
          <span className="block font-semibold">Puedo llevar una silla de ruedas plegable</span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--text-muted)]">
            Tu vehículo aparecerá como apto en el filtro de accesibles.
          </span>
        </span>
      </label>

      <label className="form-check-option mb-0 mt-4">
        <input
          type="checkbox"
          className="app-checkbox form-checkbox"
          checked={value.boardingAssistance}
          onChange={(event) => onChange({ ...value, boardingAssistance: event.target.checked })}
        />
        <span>Puedo ayudar a subir y bajar del vehículo</span>
      </label>
    </section>
  );
}
