import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { CancelRideSheet } from "@/features/my-rides/components/CancelRideSheet";
import { FinishRideSheet } from "@/features/my-rides/components/FinishRideSheet";
import { MyRidesEmpty } from "@/features/my-rides/components/MyRidesEmpty";
import { StartRideSheet } from "@/features/my-rides/components/StartRideSheet";
import { TripRoute } from "@/features/my-rides/components/TripRoute";
import { myRidesService } from "@/features/my-rides/services/myRidesService";
import type { DriverRide, RidePassenger } from "@/features/my-rides/types";
import { errorMessage, estimatedArrival, formatCountdown, plural } from "@/features/my-rides/utils";
import { formatDepartureDay } from "@/features/rides/utils/route";
import { formatDepartureLabel, formatLimaDayMonth, formatLimaTime, getLimaDayLabel } from "@/shared/utils/limaTime";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import PlayIcon from "@/assets/images/icons/play.svg?react";
import PlusIcon from "@/assets/images/icons/plus-circle.svg?react";

type Action = { type: "cancel" | "start" | "finish"; item: DriverRide };

type DriverMyRidesProps = {
  onToast: (message: string) => void;
};

function PassengerList({ title, passengers }: { title: string; passengers: RidePassenger[] }) {
  if (!passengers.length) {
    return null;
  }
  return (
    <div className="mt-4">
      <p className="publish-label">{title}</p>
      <ul className="mt-2 space-y-2.5">
        {passengers.map((passenger) => (
          <li key={passenger.bookingId} className="flex items-center gap-3">
            <DriverAvatar
              name={passenger.name}
              photoUrl={passenger.photoUrl}
              className="ride-driver-avatar h-9 w-9"
            />
            <p className="min-w-0 flex-1 text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              {passenger.name}{" "}
              {passenger.rating ? (
                <span className="text-sm font-normal text-[var(--text-muted)]">
                  <span className="text-amber-500">★</span>
                  {passenger.rating.average}
                </span>
              ) : null}
            </p>
            <span className="shrink-0 text-sm text-[var(--text-muted)]">
              {plural(passenger.seats, "plaza", "plazas")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InProgressCard({ item, onFinish }: { item: DriverRide; onFinish: () => void }) {
  const { ride } = item;
  const startedAt = new Date(ride.startedAt ?? ride.departureTime);
  const onBoard = item.passengers.filter((passenger) => passenger.status === "IN_RIDE");
  return (
    <article className="ride-card border-l-4 border-l-[#1b7f3b]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="status-chip status-chip-green">En curso</span>
        {ride.campus?.city ? <span className="mode-chip py-0.5 text-xs">Sede {ride.campus.city}</span> : null}
      </div>
      <p className="mt-2 text-sm tabular-nums text-[var(--text-muted)]">
        Salió {formatLimaTime(startedAt)} · Llegada est.{" "}
        {formatLimaTime(estimatedArrival(startedAt, ride.durationMin))}
      </p>
      <div className="my-rides-departure mt-3">
        <TripRoute origin={ride.origin} destination={ride.destination} variant="inline" />
      </div>
      <PassengerList title={`Pasajeros a bordo (${onBoard.length})`} passengers={onBoard} />
      <button type="button" className="publish-submit mt-4 gap-2" onClick={onFinish}>
        <CheckCircleIcon className="h-5 w-5" />
        Finalizar viaje
      </button>
    </article>
  );
}

function PublishedCard({
  item,
  hasRideInProgress,
  onStart,
  onCancel,
}: {
  item: DriverRide;
  hasRideInProgress: boolean;
  onStart: () => void;
  onCancel: () => void;
}) {
  const { ride } = item;
  const now = Date.now();
  const departure = new Date(ride.departureTime);
  const startableFrom = new Date(item.startableFrom);
  const reserved = ride.totalSeats - ride.availableSeats;
  const countdown = formatCountdown(departure);
  const confirmed = item.passengers.filter((passenger) => passenger.status === "CONFIRMED");

  // RN-43 y RN-46.
  const startNote = hasRideInProgress
    ? "Finaliza tu viaje en curso para iniciar este."
    : now < startableFrom.getTime()
      ? `Disponible desde las ${formatLimaTime(startableFrom)}`
      : now > new Date(item.startableUntil).getTime()
        ? "Ya pasó el plazo para iniciar este viaje"
        : null;
  const canCancel = new Date(item.cancellableUntil).getTime() >= now;
  const startNoteId = `start-note-${ride.id}`;
  const cancelNoteId = `cancel-note-${ride.id}`;

  return (
    <article className="ride-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="status-chip">Publicado</span>
        {ride.campus?.city ? <span className="mode-chip py-0.5 text-xs">Sede {ride.campus.city}</span> : null}
      </div>

      <div className="my-rides-departure mt-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div>
            <p className="publish-label whitespace-nowrap">Salida programada</p>
            <p className="whitespace-nowrap text-[1.5rem] font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
              {formatDepartureLabel(departure)}
            </p>
          </div>
          {countdown ? (
            <span className="my-rides-pill bg-[var(--brand-soft)] text-[var(--brand-red)]">{countdown}</span>
          ) : null}
        </div>
        <div className="mt-3">
          <TripRoute origin={ride.origin} destination={ride.destination} variant="inline" />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">Ocupación</span>
          <span className="font-semibold text-[var(--text-primary)]">
            {reserved} de {plural(ride.totalSeats, "plaza reservada", "plazas reservadas")}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e1e1e1]"
          role="progressbar"
          aria-label="Plazas reservadas"
          aria-valuemin={0}
          aria-valuemax={ride.totalSeats}
          aria-valuenow={reserved}
        >
          <div
            className="h-full rounded-full bg-[var(--brand-red)]"
            style={{ width: `${(reserved / Math.max(1, ride.totalSeats)) * 100}%` }}
          />
        </div>
      </div>

      <PassengerList
        title={`Pasajeros confirmados (${plural(confirmed.length, "reserva", "reservas")})`}
        passengers={confirmed}
      />

      <div className="mt-4 border-t border-[var(--border-neutral)] pt-4">
        <button
          type="button"
          className="ride-reserve-button mt-0 gap-2"
          aria-disabled={Boolean(startNote)}
          aria-describedby={startNote ? startNoteId : undefined}
          onClick={() => {
            if (!startNote) {
              onStart();
            }
          }}
        >
          <PlayIcon className="h-5 w-5" />
          Iniciar viaje
        </button>
        {startNote ? (
          <p id={startNoteId} className="mt-2 text-center text-sm text-[var(--text-muted)]">
            {startNote}
          </p>
        ) : null}

        <button
          type="button"
          className="my-rides-text-button mx-auto mt-3 block"
          aria-disabled={!canCancel}
          aria-describedby={canCancel ? undefined : cancelNoteId}
          onClick={() => {
            if (canCancel) {
              onCancel();
            }
          }}
        >
          Cancelar viaje
        </button>
        {canCancel ? null : (
          <p id={cancelNoteId} className="mt-1 text-center text-sm text-[var(--text-muted)]">
            Ya no puedes cancelar: faltan menos de 30 minutos para la salida. Si no puedes hacer el
            viaje, no lo inicies y se cancelará solo.
          </p>
        )}
      </div>
    </article>
  );
}

/** Etiqueta de la sección de un viaje publicado: «Próximo viaje / Salida hoy», «Mañana»… */
function sectionLabel(departure: Date, isFirst: boolean) {
  const day = getLimaDayLabel(departure);
  const label = day === "hoy" ? "Salida hoy" : day === "mañana" ? "Mañana" : formatDepartureDay(departure);
  return isFirst ? `Próximo viaje / ${label}` : label;
}

/** Mis viajes en modo conductor (frames 17-B, 17-D, 17-E, 17-F y 17-G). */
export function DriverMyRides({ onToast }: DriverMyRidesProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);

  const ridesQuery = useQuery({
    queryKey: ["rides", "mine"],
    queryFn: myRidesService.getMyDriverRides,
  });

  const actionMutation = useMutation({
    mutationFn: (payload: { action: Action; reason?: string; boarded?: string[] }) => {
      const rideId = payload.action.item.ride.id;
      switch (payload.action.type) {
        case "cancel":
          return myRidesService.cancelRide(rideId, payload.reason ?? "");
        case "start":
          return myRidesService.startRide(rideId, payload.boarded ?? []);
        default:
          return myRidesService.finishRide(rideId);
      }
    },
    onSuccess: (response) => {
      setAction(null);
      onToast(response.message);
    },
    onSettled: () => {
      // Cambia el estado del viaje, sus plazas y el contador: se refrescan los viajes y el perfil.
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });

  const openAction = (next: Action) => {
    actionMutation.reset();
    setAction(next);
  };

  if (ridesQuery.isLoading) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando tus viajes...</p>;
  }
  if (!ridesQuery.data) {
    return (
      <div className="dashboard-alert" role="alert">
        <p className="flex-1">No pudimos cargar tus viajes.</p>
        <button type="button" className="shrink-0 font-semibold underline" onClick={() => ridesQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const { data, cancellations } = ridesQuery.data;
  const inProgress = data.filter((item) => item.ride.status === "IN_PROGRESS");
  const published = data.filter((item) => item.ride.status === "PUBLISHED");
  const isBlocked = Boolean(cancellations.blockedUntil);
  const error = actionMutation.isError ? errorMessage(actionMutation.error) : null;
  const isBusy = actionMutation.isPending;

  return (
    <>
      {isBlocked && cancellations.blockedUntil ? (
        <div id="publish-blocked-reason" className="dashboard-alert" role="status">
          <LockIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Cancelaste {cancellations.count} viajes en los últimos {cancellations.windowDays} días.
            Podrás publicar de nuevo desde el {formatLimaDayMonth(new Date(cancellations.blockedUntil))}.
          </p>
        </div>
      ) : (
        <div className="dashboard-notice items-center text-[var(--text-primary)]">
          <InfoIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
          <p>
            {cancellations.count} de {cancellations.limit} viajes cancelados en los últimos{" "}
            {cancellations.windowDays} días
          </p>
        </div>
      )}

      {data.length === 0 ? <MyRidesEmpty isDriver /> : null}

      {inProgress.map((item) => (
        <section key={item.ride.id} className="space-y-3">
          <p className="my-rides-section-label text-[var(--brand-red)]">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-red)]" />
            En curso
          </p>
          <InProgressCard item={item} onFinish={() => openAction({ type: "finish", item })} />
        </section>
      ))}

      {published.map((item, index) => {
        const departure = new Date(item.ride.departureTime);
        const label = sectionLabel(departure, index === 0);
        const previous = index > 0 ? sectionLabel(new Date(published[index - 1].ride.departureTime), false) : null;
        // Los viajes del mismo día comparten la etiqueta.
        const showLabel = index === 0 || previous !== sectionLabel(departure, false);
        return (
          <section key={item.ride.id} className="space-y-3">
            {showLabel ? <p className="my-rides-section-label">{label}</p> : null}
            <PublishedCard
              item={item}
              hasRideInProgress={inProgress.length > 0}
              onStart={() => openAction({ type: "start", item })}
              onCancel={() => openAction({ type: "cancel", item })}
            />
          </section>
        );
      })}

      {data.length > 0 ? (
        <div className="my-rides-publish-bar">
          {isBlocked ? (
            <button
              type="button"
              className="publish-submit gap-2"
              disabled
              aria-describedby="publish-blocked-reason"
            >
              <PlusIcon className="h-5 w-5" />
              Publicar un nuevo viaje
            </button>
          ) : (
            <Link to="/viajes/publicar" className="publish-submit gap-2">
              <PlusIcon className="h-5 w-5" />
              Publicar un nuevo viaje
            </Link>
          )}
        </div>
      ) : null}

      {action?.type === "cancel" ? (
        <CancelRideSheet
          item={action.item}
          cancellations={cancellations}
          isCancelling={isBusy}
          error={error}
          onConfirm={(reason) => actionMutation.mutate({ action, reason })}
          onClose={() => setAction(null)}
        />
      ) : null}
      {action?.type === "start" ? (
        <StartRideSheet
          item={action.item}
          isStarting={isBusy}
          error={error}
          onConfirm={(boarded) => actionMutation.mutate({ action, boarded })}
          onClose={() => setAction(null)}
        />
      ) : null}
      {action?.type === "finish" ? (
        <FinishRideSheet
          item={action.item}
          isFinishing={isBusy}
          error={error}
          onConfirm={() => actionMutation.mutate({ action })}
          onClose={() => setAction(null)}
        />
      ) : null}
    </>
  );
}
