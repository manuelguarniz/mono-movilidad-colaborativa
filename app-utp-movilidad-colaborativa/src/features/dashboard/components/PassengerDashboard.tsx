import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RideCard } from "@/features/dashboard/components/RideCard";
import { RideConditionsModal } from "@/features/dashboard/components/RideConditionsModal";
import { RideFiltersSheet } from "@/features/dashboard/components/RideFiltersSheet";
import { RideSearchBar, type FilterField } from "@/features/dashboard/components/RideSearchBar";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import type { RideSearchFilters, RideSummary } from "@/features/dashboard/types";
import { ReserveRideConfirmModal } from "@/features/rides/components/ReserveRideConfirmModal";
import { formatDepartureLabel, formatLimaDayMonth, formatLimaTime } from "@/shared/utils/limaTime";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";

const BLOCKED_REASON_ID = "reserve-blocked-reason";

/** «Desde HH:00» con la hora actual de Perú, dentro del horario de salidas (06:00 a 23:00). */
function defaultTime() {
  const hour = Number(formatLimaTime(new Date()).slice(0, 2));
  return `${String(Math.min(23, Math.max(6, hour))).padStart(2, "0")}:00`;
}

const emptyFilters = (): RideSearchFilters => ({
  destination: "",
  time: null,
  passengers: 1,
  accessible: false,
});

/** Modo pasajero del dashboard (P06, frames 06-A a 06-E). */
export function PassengerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RideSearchFilters>(() => ({
    ...emptyFilters(),
    time: defaultTime(),
  }));
  const [filtersField, setFiltersField] = useState<FilterField | "all" | null>(null);
  const [conditionsRide, setConditionsRide] = useState<RideSummary | null>(null);
  // Viaje que espera la confirmación de la reserva.
  const [rideToReserve, setRideToReserve] = useState<RideSummary | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const ridesQuery = useInfiniteQuery({
    queryKey: ["rides", filters],
    queryFn: ({ pageParam }) => dashboardService.getRides(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = ridesQuery;

  // RF-03: 20 viajes por página, con carga al llegar al final.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const reserveMutation = useMutation({
    mutationFn: (rideId: string) => dashboardService.reserveRide(rideId),
    onSettled: () => {
      setRideToReserve(null);
      // Con éxito o con error cambian las plazas o el estado del viaje: se refresca el listado.
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });

  const handleDestinationChange = useCallback(
    (destination: string) => setFilters((current) => ({ ...current, destination })),
    [],
  );

  const pages = ridesQuery.data?.pages ?? [];
  const rides = pages.flatMap((page) => page.data);
  // La reserva activa y el bloqueo son del pasajero: se leen de la primera página.
  const activeBooking = pages[0]?.activeBooking ?? null;
  const bookingBlock = pages[0]?.bookingBlock ?? null;
  const isReserveBlocked = Boolean(activeBooking || bookingBlock);
  // La hora ya se ve en su chip: el punto de «Filtros» marca los demás filtros (06-A, 06-E).
  const hasHiddenFilters =
    filters.destination !== "" || filters.passengers > 1 || filters.accessible;
  const hasActiveFilters = hasHiddenFilters || filters.time !== null;

  const clearFilters = () => {
    setFilters(emptyFilters());
    setFiltersField(null);
  };

  return (
    <>
      {bookingBlock ? (
        <div id={BLOCKED_REASON_ID} className="dashboard-alert" role="status">
          <LockIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Cancelaste o no te presentaste a {bookingBlock.count} viajes en los últimos 30 días.
            Podrás reservar de nuevo desde el {formatLimaDayMonth(new Date(bookingBlock.until))}.
          </p>
        </div>
      ) : activeBooking ? (
        <div id={BLOCKED_REASON_ID} className="dashboard-notice" role="status">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-primary)]" />
          <div className="min-w-0">
            <p className="text-[var(--text-primary)]">
              Ya tienes una reserva activa. Cancélala para reservar otro viaje.
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {formatDepartureLabel(new Date(activeBooking.departureTime))} ·{" "}
              {activeBooking.origin} → {activeBooking.destination}
            </p>
            {/* «Ver en Mis viajes» (P17) llegará con esa pantalla; mientras, abre el detalle. */}
            <Link
              to={`/viajes/${activeBooking.rideId}`}
              className="mt-1 inline-block text-sm font-semibold text-[var(--brand-red)]"
            >
              Ver viaje
            </Link>
          </div>
        </div>
      ) : null}

      <RideSearchBar
        filters={filters}
        hasActiveFilters={hasHiddenFilters}
        onDestinationChange={handleDestinationChange}
        onOpenFilters={(field) => setFiltersField(field ?? "all")}
      />

      {reserveMutation.isSuccess && (
        <p className="dashboard-message" role="status">
          Reserva confirmada. Tu asiento en el viaje está separado.
        </p>
      )}

      {reserveMutation.isError && (
        <p className="dashboard-message dashboard-message-error" role="alert">
          {reserveMutation.error instanceof Error
            ? reserveMutation.error.message
            : "No se pudo reservar el viaje"}
        </p>
      )}

      {ridesQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          Cargando viajes disponibles...
        </p>
      ) : ridesQuery.isError && !rides.length ? (
        <div className="dashboard-alert" role="alert">
          <p className="flex-1">No pudimos cargar los viajes.</p>
          <button
            type="button"
            className="shrink-0 font-semibold underline"
            onClick={() => ridesQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : rides.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div className="dashboard-empty-icon">
            <CarIcon className="h-9 w-9" />
          </div>
          <p className="mt-4 text-base font-medium text-[var(--text-primary)]">
            No hay viajes disponibles con estos filtros
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              className="mt-4 rounded-xl bg-[var(--brand-soft)] px-5 py-2.5 font-semibold text-[var(--brand-red)]"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1 pt-1">
            <p className="publish-label">Viajes disponibles</p>
            <p className="text-sm text-[var(--text-muted)]">
              {rides.length}
              {hasNextPage ? "+" : ""} {rides.length === 1 ? "viaje" : "viajes"}
            </p>
          </div>

          <div className="space-y-4">
            {rides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                reserveBlockedReasonId={isReserveBlocked ? BLOCKED_REASON_ID : undefined}
                onOpen={(rideId) => navigate(`/viajes/${rideId}`)}
                onShowConditions={setConditionsRide}
                onReserve={(selected) => {
                  reserveMutation.reset();
                  setRideToReserve(selected);
                }}
              />
            ))}
          </div>

          <div ref={sentinelRef} aria-hidden="true" />
          {isFetchingNextPage ? (
            <p className="py-4 text-center text-sm text-[var(--text-muted)]">
              Cargando más viajes...
            </p>
          ) : null}
        </>
      )}

      {filtersField ? (
        <RideFiltersSheet
          filters={filters}
          focusField={filtersField === "all" ? undefined : filtersField}
          onApply={(applied) => {
            setFilters(applied);
            setFiltersField(null);
          }}
          onClear={clearFilters}
          onClose={() => setFiltersField(null)}
        />
      ) : null}

      {conditionsRide ? (
        <RideConditionsModal
          conditions={conditionsRide.conditions}
          onClose={() => setConditionsRide(null)}
        />
      ) : null}

      {rideToReserve ? (
        <ReserveRideConfirmModal
          ride={rideToReserve}
          isReserving={reserveMutation.isPending}
          onConfirm={() => reserveMutation.mutate(rideToReserve.id)}
          onCancel={() => setRideToReserve(null)}
        />
      ) : null}
    </>
  );
}
