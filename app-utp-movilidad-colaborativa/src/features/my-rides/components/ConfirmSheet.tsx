import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ConfirmSheetProps = {
  titleId: string;
  // Mientras se envía, no se cierra con el fondo ni con Escape.
  isBusy: boolean;
  // Mensaje de la API: el modal sigue abierto y lo muestra sobre los botones.
  error: string | null;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
};

/** Hoja inferior de confirmación de Mis viajes (frames 17-C a 17-F). */
export function ConfirmSheet({
  titleId,
  isBusy,
  error,
  onClose,
  children,
  actions,
}: ConfirmSheetProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isBusy, onClose]);

  return createPortal(
    <div
      className="app-sheet-backdrop bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => {
        if (!isBusy) {
          onClose();
        }
      }}
    >
      <div
        className="app-sheet max-h-[90dvh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="publish-sheet-handle block" aria-hidden="true" />
        {children}
        {error ? (
          <div className="dashboard-alert mt-4" role="alert">
            <p>{error}</p>
          </div>
        ) : null}
        <div className="mt-5 space-y-3">{actions}</div>
      </div>
    </div>,
    document.body,
  );
}
