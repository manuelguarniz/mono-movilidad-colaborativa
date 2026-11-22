import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import InfoIcon from "@/assets/images/icons/info.svg?react";

const TITLE_ID = "discard-changes-title";

/**
 * «¿Descartar los cambios?» al tocar «Descartar cambios» o «←» con cambios sin guardar
 * (decisiones de flujo de P15 y P16; no tiene frame propio).
 */
export function DiscardChangesSheet({
  onDiscard,
  onClose,
}: {
  onDiscard: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmSheet
      titleId={TITLE_ID}
      isBusy={false}
      error={null}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="auth-button-primary mt-0" onClick={onDiscard}>
            Descartar
          </button>
          <button type="button" className="profile-sheet-secondary" onClick={onClose}>
            Seguir editando
          </button>
        </>
      }
    >
      <span
        className="profile-sheet-icon bg-[var(--surface-muted)] text-[var(--text-brown)]"
        aria-hidden="true"
      >
        <InfoIcon className="h-7 w-7" />
      </span>
      <h2 id={TITLE_ID} className="profile-sheet-title">
        ¿Descartar los cambios?
      </h2>
    </ConfirmSheet>
  );
}
