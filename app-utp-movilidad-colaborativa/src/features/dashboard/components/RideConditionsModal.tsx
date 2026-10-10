import { useEffect } from "react";
import { createPortal } from "react-dom";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";

type RideConditionsModalProps = {
  // Condiciones que el conductor definió para el viaje (RF-11).
  conditions: string[];
  onClose: () => void;
};

export function RideConditionsModal({ conditions, onClose }: RideConditionsModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Se dibuja en `body` para que los estilos de la pantalla que lo abre no lo desplacen.
  return createPortal(
    <div
      className="app-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ride-conditions-title"
      onClick={onClose}
    >
      <div
        className="app-modal pt-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="ride-conditions-title"
            className="text-xl font-semibold text-[var(--text-primary)]"
          >
            Condiciones del viaje
          </h2>
          <button
            type="button"
            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-brown)] transition active:scale-95"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {conditions.length ? (
          <ul className="mt-4 space-y-2.5">
            {conditions.map((condition, index) => (
              <li
                key={`${condition}-${index}`}
                className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-[var(--text-brown)]"
              >
                <CheckCircleIcon className="mt-px h-5 w-5 shrink-0 text-[var(--brand-red)]" />
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[0.9375rem] text-[var(--text-brown)]">
            El conductor no definió condiciones para este viaje.
          </p>
        )}

        <button
          type="button"
          className="auth-button-primary mt-5 h-12 rounded-lg text-base font-medium"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body,
  );
}
