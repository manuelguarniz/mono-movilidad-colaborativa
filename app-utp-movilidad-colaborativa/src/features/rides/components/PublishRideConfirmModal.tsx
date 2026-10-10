import CarIcon from "@/assets/images/icons/ride.svg?react";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import CoinIcon from "@/assets/images/icons/coin.svg?react";

type PublishRideConfirmModalProps = {
  directionLabel: string;
  // Hora y día de la salida, por ejemplo «07:30 AM, mañana».
  departureLabel: string;
  seats: number;
  pricePerSeat: number;
  isPublishing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PublishRideConfirmModal({
  directionLabel,
  departureLabel,
  seats,
  pricePerSeat,
  isPublishing,
  onConfirm,
  onCancel,
}: PublishRideConfirmModalProps) {
  return (
    <div
      className="app-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-ride-title"
    >
      <div className="app-modal">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-red)]">
          <CarIcon className="h-7 w-7" />
        </div>

        <h2
          id="publish-ride-title"
          className="mt-4 text-center text-xl font-bold text-[var(--text-primary)]"
        >
          ¿Publicar este viaje?
        </h2>

        <p className="mt-2 text-center text-[0.9375rem] leading-snug text-[var(--text-brown)]">
          Tu ruta universitaria estará disponible inmediatamente para que los
          compañeros de tu campus reserven sus asientos.
        </p>

        <div className="mt-5 space-y-2 rounded-xl border border-[var(--border-neutral)] bg-[#f3f3f3] px-3 py-3">
          <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            <ClockIcon className="h-5 w-5 shrink-0 text-[var(--brand-red)]" />
            <span>
              {directionLabel} • {departureLabel}
            </span>
          </p>
          <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <CoinIcon className="h-5 w-5 shrink-0 text-[#0b6e8e]" />
            <span>
              {seats} {seats === 1 ? "plaza disponible" : "plazas disponibles"} •{" "}
              {pricePerSeat} {pricePerSeat === 1 ? "crédito" : "créditos"}/plaza
            </span>
          </p>
        </div>

        <button
          type="button"
          className="auth-button-primary mt-6 gap-2 rounded-full text-base"
          onClick={onConfirm}
          disabled={isPublishing}
        >
          <CheckCircleIcon className="h-5 w-5" />
          {isPublishing ? "Publicando..." : "Confirmar y Publicar"}
        </button>

        <button
          type="button"
          className="mt-3 w-full py-2 text-center text-[0.9375rem] text-[var(--text-muted)] disabled:opacity-60"
          onClick={onCancel}
          disabled={isPublishing}
        >
          Seguir editando
        </button>
      </div>
    </div>
  );
}
