import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { CancelBookingSheet } from "@/features/my-rides/components/CancelBookingSheet";
import { MyRidesEmpty } from "@/features/my-rides/components/MyRidesEmpty";
import { TripRoute } from "@/features/my-rides/components/TripRoute";
import { myRidesService } from "@/features/my-rides/services/myRidesService";
import type { OwnBooking } from "@/features/my-rides/types";
import { errorMessage, estimatedArrival, formatCountdown, plural } from "@/features/my-rides/utils";
import { GoldCoinIcon } from "@/shared/icons";
import { formatDepartureLabel, formatLimaTime } from "@/shared/utils/limaTime";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import PassengersIcon from "@/assets/images/icons/passengers.svg?react";

type PassengerMyRidesProps = {
  onToast: (message: string) => void;
};

const CANCEL_DEADLINE_ID = "booking-cancel-deadline";

const cancelledLabel = (booking: OwnBooking) =>
  booking.cancelledBy === "SYSTEM" ? "Cancelado: el viaje no se inició" : "Cancelado por el conductor";

function ActiveBookingCard({ booking, onCancel }: { booking: OwnBooking; onCancel: () => void }) {
  const { ride } = booking;
  const { driver, vehicle } = ride;
  const isInRide = booking.status === "IN_RIDE";
  const departure = new Date(ride.departureTime);
  const startedAt = ride.startedAt ? new Date(ride.startedAt) : departure;
  const cancellableUntil = new Date(booking.cancellableUntil);
  const canCancel = cancellableUntil.getTime() >= Date.now();
  const countdown = formatCountdown(departure);

  return (
    <article className="ride-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className={isInRide ? "status-chip status-chip-green" : "status-chip"}>
          {isInRide ? "En viaje" : "Confirmada"}
        </span>
        {ride.campus?.city ? <span className="mode-chip py-0.5">Sede {ride.campus.city}</span> : null}
      </div>

      <div className="my-rides-departure mt-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div>
            <p className="publish-label">Salida</p>
            <p className="whitespace-nowrap text-[1.75rem] font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
              {isInRide ? `Salió ${formatLimaTime(startedAt)}` : formatDepartureLabel(departure)}
            </p>
          </div>
          {isInRide ? (
            <span className="my-rides-pill bg-[#e6f4ea] text-[#1b7f3b]">
              Llegada est. {formatLimaTime(estimatedArrival(startedAt, ride.durationMin))}
            </span>
          ) : countdown ? (
            <span className="my-rides-pill bg-[var(--brand-soft)] text-[var(--brand-red)]">
              {countdown}
            </span>
          ) : null}
        </div>
        <div className="my-4 border-t border-[#d9d9d9]" />
        <TripRoute origin={ride.origin} destination={ride.destination} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <DriverAvatar name={driver.name} photoUrl={driver.photoUrl} className="ride-driver-avatar h-11 w-11" />
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {driver.name}{" "}
            {driver.rating ? (
              <span className="font-normal text-[var(--text-muted)]">
                <span className="text-amber-500">★</span>
                {driver.rating.average} ({driver.rating.count})
              </span>
            ) : null}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {vehicle.brand} {vehicle.model} {vehicle.color.toLowerCase()} • {vehicle.plate}
          </p>
        </div>
      </div>

      <div className="my-3 border-t border-[var(--border-neutral)]" />
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[0.9375rem] text-[var(--text-primary)]">
          <PassengersIcon className="h-5 w-5 text-[var(--text-muted)]" />
          {plural(booking.seats, "plaza", "plazas")}
        </p>
        <span className="my-rides-credits">
          <GoldCoinIcon className="h-5 w-5" />
          {plural(booking.totalCredits, "crédito retenido", "créditos retenidos")}
        </span>
      </div>
      <div className="my-3 border-t border-[var(--border-neutral)]" />

      {isInRide ? (
        <>
          <p className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
            Los créditos se pagan al conductor cuando termine el viaje.
          </p>
          <Link to={`/viajes/${ride.id}`} className="publish-secondary-button mt-3 h-11">
            Ver detalle
          </Link>
        </>
      ) : (
        <>
          <p id={CANCEL_DEADLINE_ID} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
            <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-red)]" />
            {canCancel ? (
              <span>
                Puedes cancelar gratis hasta las{" "}
                <strong className="text-[var(--text-primary)]">{formatLimaTime(cancellableUntil)}</strong>.
              </span>
            ) : (
              "Ya no puedes cancelar: faltan menos de 30 minutos para la salida"
            )}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              className="my-rides-text-button"
              aria-disabled={!canCancel}
              aria-describedby={canCancel ? undefined : CANCEL_DEADLINE_ID}
              onClick={() => {
                if (canCancel) {
                  onCancel();
                }
              }}
            >
              Cancelar reserva
            </button>
            <Link to={`/viajes/${ride.id}`} className="my-rides-soft-button">
              Ver detalle
            </Link>
          </div>
        </>
      )}
    </article>
  );
}

function CancelledBookingCard({ booking }: { booking: OwnBooking }) {
  const { ride } = booking;
  return (
    <article className="ride-card bg-[#fcfcfc]">
      <span className="status-chip bg-[var(--brand-soft)] text-[var(--brand-red)]">
        {cancelledLabel(booking)}
      </span>
      <p className="mt-3 text-[0.9375rem] text-[var(--text-primary)]">
        {formatDepartureLabel(new Date(ride.departureTime))} · {ride.origin.label} →{" "}
        {ride.destination.label}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border-neutral)] pt-3">
        <span className="my-rides-pill flex items-center gap-1.5 bg-[#e6f4ea] text-[#1b7f3b]">
          <CheckCircleIcon className="h-4 w-4" />
          Te devolvimos {plural(booking.totalCredits, "crédito", "créditos")}.
        </span>
        {ride.campus?.city ? (
          <span className="whitespace-nowrap text-sm text-[var(--text-muted)]">Sede {ride.campus.city}</span>
        ) : null}
      </div>
    </article>
  );
}

/** Mis viajes en modo pasajero (frames 17-A, 17-C, 17-G y 17-H). */
export function PassengerMyRides({ onToast }: PassengerMyRidesProps) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  const bookingsQuery = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: myRidesService.getMyBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => myRidesService.cancelBooking(bookingId),
    onSuccess: (response) => {
      setIsConfirming(false);
      onToast(response.message);
    },
    onSettled: () => {
      // Las plazas vuelven al viaje: se refrescan el listado, el detalle y Mis viajes.
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });

  if (bookingsQuery.isLoading) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando tus viajes...</p>;
  }
  if (!bookingsQuery.data) {
    return (
      <div className="dashboard-alert" role="alert">
        <p className="flex-1">No pudimos cargar tus viajes.</p>
        <button type="button" className="shrink-0 font-semibold underline" onClick={() => bookingsQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const { active, cancelled, cancellations } = bookingsQuery.data;

  return (
    <>
      {active ? (
        <section className="space-y-3">
          <p className="my-rides-section-label text-[var(--brand-red)]">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-red)]" />
            Tu reserva
          </p>
          <ActiveBookingCard
            booking={active}
            onCancel={() => {
              cancelMutation.reset();
              setIsConfirming(true);
            }}
          />
        </section>
      ) : (
        <MyRidesEmpty isDriver={false} />
      )}

      {cancelled.length ? (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="my-rides-section-label">Cancelados recientemente</p>
            <span className="text-sm text-[var(--text-muted)]">Visibles 24 h</span>
          </div>
          {cancelled.map((booking) => (
            <CancelledBookingCard key={booking.id} booking={booking} />
          ))}
        </section>
      ) : null}

      {isConfirming && active ? (
        <CancelBookingSheet
          booking={active}
          cancellations={cancellations}
          isCancelling={cancelMutation.isPending}
          error={cancelMutation.isError ? errorMessage(cancelMutation.error) : null}
          onConfirm={() => cancelMutation.mutate(active.id)}
          onClose={() => setIsConfirming(false)}
        />
      ) : null}
    </>
  );
}
