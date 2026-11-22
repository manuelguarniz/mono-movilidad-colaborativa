import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";

const TITLE_ID = "remove-assistance-title";

/**
 * 15-D: confirma quitar la asistencia guardada. Solo cambia el formulario; se guarda con
 * «Guardar cambios» (decisiones de flujo de P15).
 */
export function RemoveAssistanceSheet({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
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
          <button type="button" className="auth-button-primary mt-0" onClick={onConfirm}>
            Quitar asistencia
          </button>
          <button type="button" className="profile-sheet-secondary" onClick={onClose}>
            Cancelar
          </button>
        </>
      }
    >
      <span
        className="profile-sheet-icon bg-[var(--brand-soft)] text-[var(--brand-red)]"
        aria-hidden="true"
      >
        <AccessibleIcon className="h-7 w-7" />
      </span>
      <h2 id={TITLE_ID} className="profile-sheet-title">
        ¿Quitar tu necesidad de asistencia?
      </h2>
      <p className="mt-2 text-center text-sm text-[var(--text-brown)]">
        Se borrarán el tipo y la nota de tu perfil, y los conductores ya no la verán en tus
        próximas reservas. Tu reserva actual conserva la información.
      </p>
    </ConfirmSheet>
  );
}
