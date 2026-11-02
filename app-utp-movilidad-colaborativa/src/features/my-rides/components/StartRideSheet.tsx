import { useState } from "react";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import type { DriverRide } from "@/features/my-rides/types";
import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import { plural } from "@/features/my-rides/utils";
import PlayIcon from "@/assets/images/icons/play.svg?react";

type StartRideSheetProps = {
  item: DriverRide;
  isStarting: boolean;
  error: string | null;
  onConfirm: (boardedBookingIds: string[]) => void;
  onClose: () => void;
};

/** «¿Quiénes subieron?» (frame 17-E, RN-43): todos marcados por defecto. */
export function StartRideSheet({ item, isStarting, error, onConfirm, onClose }: StartRideSheetProps) {
  const passengers = item.passengers.filter((passenger) => passenger.status === "CONFIRMED");
  const [boarded, setBoarded] = useState(
    () => new Set(passengers.map((passenger) => passenger.bookingId)),
  );

  const toggle = (bookingId: string) =>
    setBoarded((current) => {
      const next = new Set(current);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });

  return (
    <ConfirmSheet
      titleId="start-ride-title"
      isBusy={isStarting}
      error={error}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="publish-submit gap-2"
            disabled={isStarting}
            onClick={() => onConfirm([...boarded])}
          >
            <PlayIcon className="h-5 w-5" />
            {isStarting ? "Iniciando..." : "Confirmar inicio"}
          </button>
          <button
            type="button"
            className="publish-secondary-button mt-0"
            disabled={isStarting}
            onClick={onClose}
          >
            Cancelar
          </button>
        </>
      }
    >
      <h2
        id="start-ride-title"
        className="mt-5 text-[1.375rem] font-semibold text-[var(--text-primary)]"
      >
        ¿Quiénes subieron?
      </h2>
      {passengers.length === 0 ? (
        <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
          Este viaje no tiene reservas. ¿Iniciar de todas formas?
        </p>
      ) : (
        <>
          <p className="mt-1 text-[0.9375rem] text-[var(--text-muted)]">
            Desmarca a quien no se presentó. Sus créditos se pagan igual al cerrar el viaje.
          </p>
          <ul className="mt-4 space-y-2.5">
            {passengers.map((passenger) => {
              const isBoarded = boarded.has(passenger.bookingId);
              return (
                <li key={passenger.bookingId}>
                  <label
                    className={`my-rides-boarding-row ${isBoarded ? "" : "bg-[#fafafa] opacity-70"}`}
                  >
                    <DriverAvatar
                      name={passenger.name}
                      photoUrl={passenger.photoUrl}
                      className={`ride-driver-avatar h-11 w-11 ${isBoarded ? "bg-[var(--brand-soft)] text-[var(--brand-red)]" : ""}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-[var(--text-primary)]">
                        {passenger.name}
                        {isBoarded ? (
                          <span className="status-chip status-chip-green">Subió</span>
                        ) : (
                          <span className="status-chip bg-[var(--surface-muted)] font-medium text-[var(--text-muted)]">
                            No se presentó
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {plural(passenger.seats, "plaza reservada", "plazas reservadas")}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="app-checkbox h-6 w-6"
                      checked={isBoarded}
                      disabled={isStarting}
                      aria-label={`${passenger.name} subió`}
                      onChange={() => toggle(passenger.bookingId)}
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </ConfirmSheet>
  );
}
