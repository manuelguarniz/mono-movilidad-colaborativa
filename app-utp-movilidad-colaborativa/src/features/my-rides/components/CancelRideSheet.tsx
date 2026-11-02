import { useState } from "react";
import type { CancellationCounter, DriverRide } from "@/features/my-rides/types";
import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import { formatDepartureLabel, formatLimaDayMonth } from "@/shared/utils/limaTime";
import AlertCircleIcon from "@/assets/images/icons/alert-circle.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";
import WarningIcon from "@/assets/images/icons/warning.svg?react";

const MAX_REASON = 200;

type CancelRideSheetProps = {
  item: DriverRide;
  cancellations: CancellationCounter;
  isCancelling: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

/** «¿Cancelar el viaje?» (frame 17-D, RN-26). */
export function CancelRideSheet({
  item,
  cancellations,
  isCancelling,
  error,
  onConfirm,
  onClose,
}: CancelRideSheetProps) {
  const [reason, setReason] = useState("");
  const { ride } = item;
  const bookings = item.passengers.filter((passenger) => passenger.status === "CONFIRMED").length;
  // La advertencia solo aparece si esta cancelación lo deja en el límite (RN-30).
  const blockUntil = cancellations.blockedUntil ? null : cancellations.blockedUntilIfCancelled;

  return (
    <ConfirmSheet
      titleId="cancel-ride-title"
      isBusy={isCancelling}
      error={error}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="publish-submit gap-2"
            disabled={isCancelling}
            onClick={() => onConfirm(reason)}
          >
            <CloseIcon className="h-5 w-5" />
            {isCancelling ? "Cancelando..." : "Sí, cancelar viaje"}
          </button>
          <button
            type="button"
            className="publish-secondary-button mt-0"
            disabled={isCancelling}
            onClick={onClose}
          >
            Volver
          </button>
        </>
      }
    >
      <div className="my-rides-sheet-icon mt-5 bg-[var(--brand-soft)] text-[var(--brand-red)]">
        <WarningIcon className="h-7 w-7" />
      </div>
      <h2
        id="cancel-ride-title"
        className="mt-4 text-center text-[1.375rem] font-semibold text-[var(--text-primary)]"
      >
        ¿Cancelar el viaje?
      </h2>
      {bookings > 0 ? (
        <p className="mt-2 text-center text-[0.9375rem] text-[var(--text-muted)]">
          {bookings === 1
            ? "Se cancelará la reserva confirmada y se devolverán sus créditos."
            : `Se cancelarán las ${bookings} reservas confirmadas y se devolverán sus créditos.`}
        </p>
      ) : null}
      <p className="my-rides-sheet-summary mt-4">
        <ClockIcon className="mr-1.5 inline h-4 w-4 align-[-2px]" />
        {formatDepartureLabel(new Date(ride.departureTime))} · {ride.origin.label} →{" "}
        {ride.destination.label}
      </p>
      {blockUntil ? (
        <div className="dashboard-alert mt-3" role="status">
          <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Con esta cancelación no podrás publicar viajes hasta el{" "}
            {formatLimaDayMonth(new Date(blockUntil))}.
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="cancel-ride-reason" className="text-sm font-semibold text-[var(--text-primary)]">
            Motivo (opcional)
          </label>
          <span className="text-xs tabular-nums text-[var(--text-muted)]">
            {reason.length}/{MAX_REASON}
          </span>
        </div>
        <textarea
          id="cancel-ride-reason"
          className="my-rides-textarea mt-2"
          rows={3}
          maxLength={MAX_REASON}
          placeholder="Ej. Emergencia mecánica, cambio de horario laboral..."
          value={reason}
          disabled={isCancelling}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
    </ConfirmSheet>
  );
}
