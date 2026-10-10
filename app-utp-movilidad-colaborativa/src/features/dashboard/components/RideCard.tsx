import type { RideSummary } from "@/features/dashboard/types";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { CarIcon, GoldCoinIcon, PassengersIcon } from "@/shared/icons";
import { formatLimaTime, getLimaDayLabel } from "@/shared/utils/limaTime";
import InfoIcon from "@/assets/images/icons/info.svg?react";

type RideCardProps = {
  ride: RideSummary;
  // Tocar la tarjeta abre el detalle del viaje.
  onOpen: (rideId: string) => void;
  onShowConditions: (ride: RideSummary) => void;
  // Abre la confirmación de la reserva.
  onReserve: (ride: RideSummary) => void;
};

export function RideCard({
  ride,
  onOpen,
  onShowConditions,
  onReserve,
}: RideCardProps) {
  const { vehicle, driver } = ride;
  const departure = new Date(ride.departureTime);

  return (
    <article
      className="ride-card cursor-pointer transition active:scale-[0.995]"
      role="link"
      tabIndex={0}
      aria-label={`Ver el detalle del viaje de ${driver.name}`}
      onClick={() => onOpen(ride.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) {
          onOpen(ride.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <GoldCoinIcon className="h-7 w-7 shrink-0" />
          <span className="text-[1.75rem] font-bold leading-none text-[var(--text-primary)]">
            {ride.pricePerSeat}
          </span>
        </div>

        <button
          type="button"
          className="ride-info-button"
          aria-label="Condiciones del viaje"
          onClick={(event) => {
            event.stopPropagation();
            onShowConditions(ride);
          }}
        >
          <InfoIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 flex gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">
            <CarIcon className="mt-px h-5 w-5 shrink-0 text-[var(--text-muted)]" />
            <span>
              {vehicle.brand} {vehicle.model} {vehicle.color}{" "}
              <span className="whitespace-nowrap">• {vehicle.plate}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-base text-[var(--text-muted)]">
            <PassengersIcon className="h-5 w-5" />
            <span aria-label="Asientos disponibles">{ride.availableSeats}</span>
          </div>

          <div className="ride-departure-box">
            <p className="text-sm text-[var(--text-muted)]">
              Salida · {getLimaDayLabel(departure)}
            </p>
            <p className="text-xl font-semibold leading-tight text-[var(--text-primary)]">
              {formatLimaTime(departure)}
            </p>
          </div>
        </div>

        <div className="flex w-[4.5rem] shrink-0 flex-col items-center text-center">
          <DriverAvatar name={driver.name} photoUrl={driver.photoUrl} />
          <p className="mt-1.5 text-sm font-semibold leading-tight text-[var(--text-primary)]">
            {driver.name}
          </p>
          {driver.rating ? (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              <span className="text-amber-500">★</span>{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {driver.rating.average}
              </span>{" "}
              ({driver.rating.count})
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="ride-reserve-button"
        onClick={(event) => {
          event.stopPropagation();
          onReserve(ride);
        }}
      >
        Reservar
      </button>
    </article>
  );
}
