import type { RideOffer } from "@/features/dashboard/types";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import {
  CarIcon,
  GoldCoinIcon,
  LuggageIcon,
  PassengersIcon,
} from "@/shared/icons";

type RideCardProps = {
  ride: RideOffer;
  onReserve: (rideId: string) => void;
  isReserving?: boolean;
};

export function RideCard({ ride, onReserve, isReserving }: RideCardProps) {
  return (
    <article className="ride-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <GoldCoinIcon className="h-14 w-14 shrink-0" />
          <span className="text-4xl font-black leading-none text-[#2f2a2a]">
            {ride.price}
          </span>
        </div>

        <button
          type="button"
          className="ride-info-button"
          aria-label="Más información del viaje"
        >
          i
        </button>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3 text-base font-semibold text-[#2f2a2a]">
            <CarIcon className="h-7 w-7 shrink-0 text-[#d93a43]" />
            <span className="truncate">{ride.vehicle}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-base text-[#5a5a5a]">
            <span className="inline-flex items-center gap-2">
              <PassengersIcon className="h-7 w-7" />
              {ride.availableSeats}
            </span>

            {ride.luggageAvailable ? (
              <span className="inline-flex items-center gap-2">
                <LuggageIcon className="h-7 w-7" />
                Disponible
              </span>
            ) : null}
          </div>

          <div className="ride-departure-box">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7a6d6d]">
              Salida
            </p>
            <p className="mt-1 text-sm font-bold text-[#2f2a2a]">
              {ride.departure.window}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center text-center">
          <DriverAvatar name={ride.driver.name} />
          <p className="mt-2 text-sm font-bold text-[#2f2a2a]">
            {ride.driver.name}
          </p>
          <p className="mt-0.5 text-xs text-[#7a6d6d]">
            <span className="text-amber-500">★</span> {ride.driver.rating} (
            {ride.driver.reviewCount})
          </p>
        </div>
      </div>

      <button
        type="button"
        className="ride-reserve-button"
        onClick={() => onReserve(ride.id)}
        disabled={isReserving}
      >
        {isReserving ? "Reservando..." : "Reservar"}
      </button>
    </article>
  );
}
