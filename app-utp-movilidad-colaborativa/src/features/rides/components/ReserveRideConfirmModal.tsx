import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { RideSummary } from "@/features/dashboard/types";
import { GoldCoinIcon } from "@/shared/icons";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import CheckIcon from "@/assets/images/icons/check.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";
import RouteIcon from "@/assets/images/icons/route.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

// Datos del viaje que resume el modal; sirven tanto el listado como el detalle.
type ReservableRide = Pick<RideSummary, "pricePerSeat" | "driver" | "vehicle"> & {
  origin: { label: string };
  destination: { label: string };
};

type ReserveRideConfirmModalProps = {
  ride: ReservableRide;
  isReserving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** «¿Confirmar reserva de viaje?» (RF-13): se abre desde la tarjeta o desde el detalle. */
export function ReserveRideConfirmModal({
  ride,
  isReserving,
  onConfirm,
  onCancel,
}: ReserveRideConfirmModalProps) {
  const { driver, vehicle } = ride;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isReserving) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isReserving, onCancel]);

  // Se dibuja en `body` para que los estilos de la pantalla que lo abre no lo desplacen.
  return createPortal(
    <div
      className="app-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-ride-title"
    >
      <div className="app-modal relative">
        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-brown)] transition active:scale-95 disabled:opacity-60"
          aria-label="Cerrar"
          disabled={isReserving}
          onClick={onCancel}
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-red)]">
          <CarIcon className="h-7 w-7" />
        </div>

        <h2
          id="reserve-ride-title"
          className="mt-3 text-center text-xl font-bold text-[var(--text-primary)]"
        >
          ¿Confirmar reserva de viaje?
        </h2>

        {/* La reserva se confirma al instante, sin aprobación del conductor (RF-14). */}
        <p className="mt-1 text-center text-[0.9375rem] leading-snug text-[var(--text-muted)]">
          Revisa los detalles antes de confirmar tu reserva.
        </p>

        <div className="mt-4 divide-y divide-[#e4e4e4] rounded-xl bg-[#f3f3f3] px-3">
          <div className="flex gap-2.5 py-3">
            <RouteIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-red)]" />
            <div className="min-w-0">
              <p className="reserve-modal-label">Ruta</p>
              <p className="reserve-modal-value">
                {ride.origin.label} → {ride.destination.label}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 py-3">
            <UserIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
            <div className="min-w-0">
              <p className="reserve-modal-label">Conductor</p>
              <p className="reserve-modal-value">
                {driver.name}{" "}
                <span className="font-normal text-[var(--text-muted)]">
                  ({vehicle.brand} {vehicle.model} {vehicle.color})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 py-3">
            <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-[var(--text-primary)]">
              <GoldCoinIcon className="h-5 w-5" />
              Aporte total:
            </p>
            <p className="text-xl font-bold text-[var(--brand-red)]">
              {ride.pricePerSeat} {ride.pricePerSeat === 1 ? "crédito" : "créditos"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="auth-button-primary mt-5 h-12 gap-2 text-base"
          onClick={onConfirm}
          disabled={isReserving}
        >
          {isReserving ? "Reservando..." : "Confirmar reserva"}
          <CheckIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="mt-2 w-full py-2 text-center text-[0.9375rem] text-[var(--text-muted)] disabled:opacity-60"
          onClick={onCancel}
          disabled={isReserving}
        >
          Cancelar
        </button>
      </div>
    </div>,
    document.body,
  );
}
