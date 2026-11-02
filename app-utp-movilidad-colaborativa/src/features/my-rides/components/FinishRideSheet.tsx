import type { DriverRide } from "@/features/my-rides/types";
import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import { plural } from "@/features/my-rides/utils";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import FlagIcon from "@/assets/images/icons/flag.svg?react";
import WalletIcon from "@/assets/images/icons/wallet.svg?react";

type FinishRideSheetProps = {
  item: DriverRide;
  isFinishing: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** «¿Finalizar el viaje?» (frame 17-F, RN-45). */
export function FinishRideSheet({ item, isFinishing, error, onConfirm, onClose }: FinishRideSheetProps) {
  // RN-40: se cobran las reservas de quienes subieron y de quienes no se presentaron.
  const earned = item.passengers
    .filter((passenger) => passenger.status !== "CONFIRMED")
    .reduce((total, passenger) => total + passenger.totalCredits, 0);
  const onBoard = item.passengers.filter((passenger) => passenger.status === "IN_RIDE").length;

  return (
    <ConfirmSheet
      titleId="finish-ride-title"
      isBusy={isFinishing}
      error={error}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="publish-submit gap-2"
            disabled={isFinishing}
            onClick={onConfirm}
          >
            <CheckCircleIcon className="h-5 w-5" />
            {isFinishing ? "Finalizando..." : "Finalizar viaje"}
          </button>
          <button
            type="button"
            className="publish-secondary-button mt-0"
            disabled={isFinishing}
            onClick={onClose}
          >
            Todavía no
          </button>
        </>
      }
    >
      <div className="my-rides-sheet-icon mt-5 bg-[#e6f4ea] text-[#1b7f3b]">
        <FlagIcon className="h-7 w-7" />
      </div>
      <h2
        id="finish-ride-title"
        className="mt-4 text-center text-[1.375rem] font-semibold text-[var(--text-primary)]"
      >
        ¿Finalizar el viaje?
      </h2>
      <p className="mt-2 text-center text-[0.9375rem] text-[var(--text-muted)]">
        Recibirás {plural(earned, "crédito", "créditos")}. Tú y tus pasajeros podrán calificarse.
      </p>
      <p className="my-rides-sheet-summary mt-4">
        <WalletIcon className="mr-1.5 inline h-4 w-4 align-[-2px] text-[#1b7f3b]" />
        <span className="font-semibold">+{plural(earned, "crédito", "créditos")} a tu billetera</span>{" "}
        <span className="font-normal text-[var(--text-muted)]">
          · {plural(onBoard, "pasajero a bordo", "pasajeros a bordo")}
        </span>
      </p>
    </ConfirmSheet>
  );
}
