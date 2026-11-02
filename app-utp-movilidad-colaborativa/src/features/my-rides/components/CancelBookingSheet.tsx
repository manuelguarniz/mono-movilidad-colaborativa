import type { CancellationCounter, OwnBooking } from "@/features/my-rides/types";
import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import { plural } from "@/features/my-rides/utils";
import { formatDepartureLabel } from "@/shared/utils/limaTime";
import CalendarXIcon from "@/assets/images/icons/calendar-x.svg?react";

type CancelBookingSheetProps = {
  booking: OwnBooking;
  cancellations: CancellationCounter;
  isCancelling: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** «¿Cancelar tu reserva?» (frame 17-C, RN-25). */
export function CancelBookingSheet({
  booking,
  cancellations,
  isCancelling,
  error,
  onConfirm,
  onClose,
}: CancelBookingSheetProps) {
  const { ride } = booking;
  return (
    <ConfirmSheet
      titleId="cancel-booking-title"
      isBusy={isCancelling}
      error={error}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="publish-submit"
            disabled={isCancelling}
            onClick={onConfirm}
          >
            {isCancelling ? "Cancelando..." : "Sí, cancelar reserva"}
          </button>
          <button
            type="button"
            className="publish-secondary-button mt-0"
            disabled={isCancelling}
            onClick={onClose}
          >
            Mantener reserva
          </button>
        </>
      }
    >
      <div className="my-rides-sheet-icon mt-5 bg-[var(--brand-soft)] text-[var(--brand-red)]">
        <CalendarXIcon className="h-7 w-7" />
      </div>
      <h2
        id="cancel-booking-title"
        className="mt-4 text-center text-[1.375rem] font-semibold text-[var(--text-primary)]"
      >
        ¿Cancelar tu reserva?
      </h2>
      <p className="mt-2 text-center text-[0.9375rem] text-[var(--text-muted)]">
        Te devolveremos{" "}
        <strong className="text-[var(--text-primary)]">
          {plural(booking.totalCredits, "crédito", "créditos")}
        </strong>
        . Llevas {cancellations.count} de {cancellations.limit} cancelaciones este mes.
      </p>
      <p className="my-rides-sheet-summary mt-4">
        {formatDepartureLabel(new Date(ride.departureTime))} · {ride.origin.label} →{" "}
        {ride.destination.label}
      </p>
    </ConfirmSheet>
  );
}
