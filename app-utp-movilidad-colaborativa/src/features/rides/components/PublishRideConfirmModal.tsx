import CarIcon from "@/assets/images/icons/ride.svg?react";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import RouteIcon from "@/assets/images/icons/route.svg?react";
import SeatIcon from "@/assets/images/icons/passenger.svg?react";
import { GoldCoinIcon } from "@/shared/icons";

type PublishRideConfirmModalProps = {
  directionLabel: string;
  // Día y hora de la salida, por ejemplo «Mañana, vie 30 oct · 07:00».
  departureLabel: string;
  // Nombres de la ruta en el orden del viaje: origen, paradas y destino.
  route: string[];
  seats: number;
  pricePerSeat: number;
  conditions: string[];
  isPublishing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Resumen del viaje antes de publicarlo (frame 12, RF-05). */
export function PublishRideConfirmModal({
  directionLabel,
  departureLabel,
  route,
  seats,
  pricePerSeat,
  conditions,
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
      <div className="app-modal max-h-[90dvh] overflow-y-auto">
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
          Aparecerá en el dashboard de todas las sedes para que otros estudiantes UTP
          reserven sus plazas.
        </p>

        <div className="mt-5 space-y-2.5 rounded-xl border border-[var(--border-neutral)] bg-[#f3f3f3] px-3 py-3 text-sm text-[var(--text-primary)]">
          <p className="flex items-start gap-2 font-semibold">
            <ClockIcon className="mt-px h-5 w-5 shrink-0 text-[var(--brand-red)]" />
            <span className="tabular-nums">
              {directionLabel} · {departureLabel}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <RouteIcon className="mt-px h-5 w-5 shrink-0 text-[var(--brand-red)]" />
            <span>{route.join(" → ")}</span>
          </p>
          <p className="flex items-center gap-2">
            <GoldCoinIcon className="h-5 w-5 shrink-0" />
            <span>
              {pricePerSeat} {pricePerSeat === 1 ? "crédito" : "créditos"} por plaza
            </span>
          </p>
          <p className="flex items-center gap-2">
            <SeatIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
            <span>
              {seats} {seats === 1 ? "plaza disponible" : "plazas disponibles"}
            </span>
          </p>
        </div>

        {conditions.length ? (
          <div className="mt-3">
            <p className="publish-label">Condiciones del viaje</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-[var(--text-primary)]">
              {conditions.map((condition, index) => (
                <li key={`${condition}-${index}`}>{condition}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          className="auth-button-primary mt-6 gap-2 rounded-full text-base"
          onClick={onConfirm}
          disabled={isPublishing}
        >
          <CheckCircleIcon className="h-5 w-5" />
          {isPublishing ? "Publicando..." : "Confirmar y publicar"}
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
