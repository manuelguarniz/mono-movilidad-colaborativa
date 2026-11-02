import TrashIcon from "@/assets/images/icons/trash.svg?react";

type DiscardRideSheetProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirma salir de «Publicar viaje» cuando el formulario tiene datos (estilo de P17-C). */
export function DiscardRideSheet({ onConfirm, onCancel }: DiscardRideSheetProps) {
  return (
    <div
      className="app-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-ride-title"
      onClick={onCancel}
    >
      <div className="app-sheet" onClick={(event) => event.stopPropagation()}>
        <span className="publish-sheet-handle block" aria-hidden="true" />

        <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-red)]">
          <TrashIcon className="h-6 w-6" />
        </div>

        <h2
          id="discard-ride-title"
          className="mt-4 text-center text-xl font-semibold text-[var(--text-primary)]"
        >
          ¿Descartar el viaje?
        </h2>
        <p className="mt-1 text-center text-[0.9375rem] text-[var(--text-muted)]">
          No se guardará nada.
        </p>

        <button type="button" className="publish-submit mt-6" onClick={onConfirm}>
          Sí, descartar
        </button>
        <button
          type="button"
          className="publish-secondary-button mt-3"
          onClick={onCancel}
        >
          Seguir editando
        </button>
      </div>
    </div>
  );
}
