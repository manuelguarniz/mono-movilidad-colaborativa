import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { myRidesService } from "@/features/my-rides/services/myRidesService";
import type { CancellationBlock, RideSummary } from "@/features/dashboard/types";
import { formatLimaDayMonth, formatLimaTime, getLimaDayLabel } from "@/shared/utils/limaTime";
import ChevronRightIcon from "@/assets/images/icons/chevron-right.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import PlusIcon from "@/assets/images/icons/plus-circle.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import { PassengersIcon } from "@/shared/icons";

type DriverDashboardProps = {
  // Bloqueo para publicar por cancelaciones (RN-30), de GET /users/me.
  cancellationBlock: CancellationBlock | null;
};

/** Nombre de lugar sin cortes de línea internos si es corto («Urb. El Golf»). */
const keepTogether = (place: string) =>
  place.length <= 24 ? place.replace(/ /g, " ") : place;

function DriverRideRow({ ride }: { ride: RideSummary }) {
  const departure = new Date(ride.departureTime);
  const isInProgress = ride.status === "IN_PROGRESS";
  const reserved = ride.totalSeats - ride.availableSeats;

  return (
    <li>
      <Link to={`/viajes/${ride.id}`} className="driver-ride-row">
        <div className="w-16 shrink-0 border-r border-[var(--border-neutral)] pr-3">
          <p className="text-xs font-medium uppercase text-[var(--text-muted)]">
            {isInProgress ? "Salió" : getLimaDayLabel(departure)}
          </p>
          <p className="text-[1.375rem] font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
            {formatLimaTime(departure)}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {ride.campus?.city ? (
              <span className="ride-city-chip">{ride.campus.city}</span>
            ) : null}
            <span className={isInProgress ? "status-chip status-chip-green" : "status-chip"}>
              {isInProgress ? "En curso" : "Publicado"}
            </span>
          </div>
          <p className="mt-1 text-[0.9375rem] leading-snug text-[var(--text-primary)]">
            {keepTogether(ride.origin.label)}{" "}
            <span className="text-[var(--brand-red)]">→</span>{" "}
            {keepTogether(ride.destination.label)}
          </p>
          {isInProgress ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              <PassengersIcon className="h-4 w-4 text-[#1b7f3b]" />
              {reserved} {reserved === 1 ? "pasajero" : "pasajeros"} a bordo
            </p>
          ) : (
            <div className="mt-1.5 flex items-center gap-3">
              <p className="whitespace-nowrap text-sm text-[var(--text-muted)]">
                {reserved} de {ride.totalSeats} plazas reservadas
              </p>
              <div
                className="h-1.5 min-w-[3rem] flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]"
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
          )}
        </div>

        <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
      </Link>
    </li>
  );
}

/** Modo conductor del dashboard (P06, frames 06-F y 06-G). */
export function DriverDashboard({ cancellationBlock }: DriverDashboardProps) {
  // Misma consulta que Mis viajes (P17): comparten la caché.
  const ridesQuery = useQuery({
    queryKey: ["rides", "mine"],
    queryFn: myRidesService.getMyDriverRides,
  });
  const rides = ridesQuery.data?.data.map((item) => item.ride) ?? [];

  return (
    <>
      <section className="ride-card p-5">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-red)]">
            <CarIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-snug text-[var(--text-primary)]">
              ¿Vas a la universidad o de regreso?
            </h3>
            <p className="mt-1 text-[0.9375rem] text-[var(--text-muted)]">
              Publica tu ruta y comparte los gastos del viaje con tu comunidad UTP.
            </p>
          </div>
        </div>

        {cancellationBlock ? (
          <>
            <div id="publish-blocked-reason" className="dashboard-alert mt-4" role="status">
              <LockIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Cancelaste {cancellationBlock.count} viajes en los últimos 30 días. Podrás
                publicar de nuevo desde el{" "}
                {formatLimaDayMonth(new Date(cancellationBlock.until))}.
              </p>
            </div>
            <button
              type="button"
              className="publish-submit mt-4 gap-2"
              disabled
              aria-describedby="publish-blocked-reason"
            >
              <PlusIcon className="h-5 w-5" />
              Publicar un viaje
            </button>
          </>
        ) : (
          <Link to="/viajes/publicar" className="publish-submit mt-4 gap-2">
            <PlusIcon className="h-5 w-5" />
            Publicar un viaje
          </Link>
        )}
      </section>

      <div className="flex items-center justify-between px-1 pt-2">
        <p className="publish-label">Tus viajes publicados</p>
      </div>

      {ridesQuery.isLoading ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">Cargando tus viajes...</p>
      ) : ridesQuery.isError ? (
        <div className="dashboard-alert" role="alert">
          <p className="flex-1">No pudimos cargar tus viajes.</p>
          <button
            type="button"
            className="shrink-0 font-semibold underline"
            onClick={() => ridesQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : rides.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-neutral)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          Todavía no tienes viajes publicados.
        </p>
      ) : (
        <ul className="space-y-3">
          {rides.map((ride) => (
            <DriverRideRow key={ride.id} ride={ride} />
          ))}
        </ul>
      )}
    </>
  );
}
