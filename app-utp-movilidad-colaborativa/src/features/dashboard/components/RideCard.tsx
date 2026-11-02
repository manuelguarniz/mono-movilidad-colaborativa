import type { RideSummary } from "@/features/dashboard/types";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { CarIcon, GoldCoinIcon } from "@/shared/icons";
import { formatDepartureLabel } from "@/shared/utils/limaTime";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import MapPinIcon from "@/assets/images/icons/map-pin.svg?react";
import SeatIcon from "@/assets/images/icons/passenger.svg?react";

type RideCardProps = {
  ride: RideSummary;
  // Motivo por el que no puede reservar (RN-23, RN-38); se muestra una vez arriba del listado.
  reserveBlockedReasonId?: string;
  // Tocar la tarjeta abre el detalle del viaje.
  onOpen: (rideId: string) => void;
  onShowConditions: (ride: RideSummary) => void;
  // Abre la confirmación de la reserva.
  onReserve: (ride: RideSummary) => void;
};

/** Tarjeta del listado del dashboard (P06, frame 06-B). */
export function RideCard({
  ride,
  reserveBlockedReasonId,
  onOpen,
  onShowConditions,
  onReserve,
}: RideCardProps) {
  const { vehicle, driver } = ride;
  const city = ride.campus?.city;
  const isBlocked = Boolean(reserveBlockedReasonId);

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
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-baseline gap-1.5">
          <GoldCoinIcon className="h-6 w-6 shrink-0 self-center" />
          <span className="text-[1.75rem] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
            {ride.pricePerSeat}
          </span>
          <span className="whitespace-nowrap text-sm text-[var(--text-muted)]">
            {ride.pricePerSeat === 1 ? "crédito" : "créditos"} por plaza
          </span>
        </p>

        <div className="flex shrink-0 items-center gap-1">
          {city ? (
            <span className="ride-city-chip">
              <MapPinIcon className="h-3.5 w-3.5" />
              {city}
            </span>
          ) : null}
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
      </div>

      <p className="mt-3 flex items-center gap-2 text-[0.9375rem] font-semibold text-[var(--text-primary)]">
        <CarIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        <span className="min-w-0">
          {vehicle.brand} {vehicle.model} {vehicle.color.toLowerCase()}{" "}
          <span className="whitespace-nowrap">• {vehicle.plate}</span>
        </span>
      </p>

      <p className="mt-2 truncate text-sm text-[var(--text-muted)]">
        {ride.origin.label} → {ride.destination.label}
      </p>

      <div className="mt-2 flex items-center gap-3 text-sm text-[var(--text-brown)]">
        <span className="flex items-center gap-1">
          <SeatIcon className="h-4 w-4" />
          {ride.availableSeats}{" "}
          {ride.availableSeats === 1 ? "asiento libre" : "asientos libres"}
        </span>
        {vehicle.wheelchairAccessible ? (
          <AccessibleIcon
            className="h-4 w-4 text-[#4d6b7a]"
            role="img"
            aria-label="Vehículo apto para silla de ruedas plegable"
          />
        ) : null}
      </div>

      <div className="ride-departure-box mt-3">
        <div className="min-w-0">
          <p className="publish-label">Salida</p>
          <p className="text-xl font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
            {formatDepartureLabel(new Date(ride.departureTime))}
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {driver.name}
            </p>
            {driver.rating ? (
              <p className="text-xs text-[var(--text-muted)]">
                <span className="text-amber-500">★</span>{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {driver.rating.average}
                </span>{" "}
                ({driver.rating.count})
              </p>
            ) : null}
          </div>
          <DriverAvatar
            name={driver.name}
            photoUrl={driver.photoUrl}
            className="ride-driver-avatar"
          />
        </div>
      </div>

      <button
        type="button"
        className="ride-reserve-button"
        aria-disabled={isBlocked}
        aria-describedby={reserveBlockedReasonId}
        onClick={(event) => {
          event.stopPropagation();
          if (!isBlocked) {
            onReserve(ride);
          }
        }}
      >
        Reservar
      </button>
    </article>
  );
}
