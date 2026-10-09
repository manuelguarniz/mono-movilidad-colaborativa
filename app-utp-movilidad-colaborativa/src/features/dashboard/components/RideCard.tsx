import type { RideSummary } from "@/features/dashboard/types";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { CarIcon, GoldCoinIcon, PassengersIcon } from "@/shared/icons";
import InfoIcon from "@/assets/images/icons/info.svg?react";

const LIMA = "America/Lima";

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const weekdayFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  weekday: "long",
});

// `en-CA` da la fecha como AAAA-MM-DD, que se puede comparar como texto.
const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: LIMA });

const DAY_MS = 24 * 60 * 60 * 1000;

/** Día de la salida en la hora de Perú: «hoy», «mañana» o el día de la semana. */
function getDepartureDay(departure: Date) {
  const day = dayFormatter.format(departure);
  const now = Date.now();
  if (day === dayFormatter.format(now)) {
    return "hoy";
  }
  if (day === dayFormatter.format(now + DAY_MS)) {
    return "mañana";
  }
  return weekdayFormatter.format(departure);
}

type RideCardProps = {
  ride: RideSummary;
  onReserve: (rideId: string) => void;
  isReserving?: boolean;
};

export function RideCard({ ride, onReserve, isReserving }: RideCardProps) {
  const { vehicle, driver } = ride;
  const departure = new Date(ride.departureTime);

  return (
    <article className="ride-card">
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
              Salida · {getDepartureDay(departure)}
            </p>
            <p className="text-xl font-semibold leading-tight text-[var(--text-primary)]">
              {timeFormatter.format(departure)}
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
        onClick={() => onReserve(ride.id)}
        disabled={isReserving}
      >
        {isReserving ? "Reservando..." : "Reservar"}
      </button>
    </article>
  );
}
