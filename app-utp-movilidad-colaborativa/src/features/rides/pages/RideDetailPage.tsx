import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { RideConditionsModal } from "@/features/dashboard/components/RideConditionsModal";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { ReserveRideConfirmModal } from "@/features/rides/components/ReserveRideConfirmModal";
import { RideRouteMap } from "@/features/rides/components/RideRouteMap";
import { rideService } from "@/features/rides/services/rideService";
import { ApiError } from "@/shared/api/apiClient";
import { CarIcon, GoldCoinIcon, PassengersIcon } from "@/shared/icons";
import { formatLimaTime12h, getLimaDayLabel } from "@/shared/utils/limaTime";
import logoUrl from "@/assets/images/logo-colaboracar.svg";
import ArrowRightIcon from "@/assets/images/icons/arrow-right.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";
import FlagIcon from "@/assets/images/icons/flag.svg?react";
import GaugeIcon from "@/assets/images/icons/gauge.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import TargetIcon from "@/assets/images/icons/target.svg?react";

const MINUTE_MS = 60 * 1000;

// El viaje no existe, o el identificador de la URL no es válido.
const isMissingRide = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 400);

export function RideDetailPage() {
  const { rideId = "" } = useParams();
  const queryClient = useQueryClient();
  const [fitKey, setFitKey] = useState(0);
  const [showConditions, setShowConditions] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const rideQuery = useQuery({
    queryKey: ["rides", rideId],
    queryFn: () => rideService.getRide(rideId),
    retry: (failureCount, error) => !isMissingRide(error) && failureCount < 1,
  });

  const { data: user } = useQuery({
    queryKey: ["users", "me"],
    queryFn: dashboardService.getCurrentUser,
  });

  const reserveMutation = useMutation({
    mutationFn: () => dashboardService.reserveRide(rideId),
    onSettled: () => {
      setIsConfirming(false);
      // Con éxito o con error cambian las plazas o el estado: se refrescan el detalle y el listado.
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });

  const header = (
    <header className="publish-header">
      <Link to="/dashboard" className="publish-header-button" aria-label="Cerrar">
        <CloseIcon className="h-6 w-6" />
      </Link>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white">
        <img src={logoUrl} alt="" className="h-3.5 w-auto" />
      </span>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Detalle Del Viaje
      </h1>
      <DriverAvatar
        name={user ? `${user.firstName.split(" ")[0]} ${user.lastName}` : ""}
        photoUrl={user?.photoUrl}
        className="dashboard-profile-avatar ml-auto"
      />
    </header>
  );

  const renderNotice = (title: string, message: string, action?: ReactNode) => (
    <div className="publish-screen">
      {header}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-[var(--webview-px)] text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 text-[0.9375rem] text-[var(--text-brown)]">{message}</p>
        {action}
        <Link to="/dashboard" className="auth-button-secondary">
          Volver a los viajes
        </Link>
      </div>
    </div>
  );

  if (rideQuery.isLoading) {
    return (
      <div className="publish-screen">
        {header}
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Cargando el viaje...
        </p>
      </div>
    );
  }

  if (isMissingRide(rideQuery.error)) {
    return renderNotice(
      "Viaje no encontrado",
      "Este viaje ya no existe o el enlace no es correcto.",
    );
  }

  const ride = rideQuery.data;
  if (!ride) {
    return renderNotice(
      "No se pudo cargar el viaje",
      rideQuery.error instanceof Error
        ? rideQuery.error.message
        : "Inténtalo nuevamente.",
      <button
        type="button"
        className="auth-button-primary mt-6"
        onClick={() => rideQuery.refetch()}
      >
        Reintentar
      </button>,
    );
  }

  const { driver, vehicle } = ride;
  const departure = new Date(ride.departureTime);
  // La llegada se estima con la duración que calcula el backend.
  const arrival = new Date(departure.getTime() + ride.durationMin * MINUTE_MS);

  const hasReserved = reserveMutation.isSuccess;
  const unavailableReason =
    ride.status !== "PUBLISHED" || departure.getTime() <= Date.now()
      ? "Este viaje ya no está disponible"
      : ride.availableSeats < 1
        ? "Este viaje ya no tiene asientos disponibles"
        : "";

  return (
    <div className="publish-screen">
      {header}

      <div className="publish-map h-[40dvh]">
        <RideRouteMap
          origin={ride.origin}
          stops={ride.stops}
          destination={ride.destination}
          fitKey={fitKey}
        />

        <p className="publish-map-chip left-3 top-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-red)]" />
          <span className="font-semibold text-[var(--text-primary)]">
            {ride.durationMin} min
          </span>
          <span className="text-[var(--text-muted)]">| Duración estimada</span>
        </p>

        <button
          type="button"
          className="publish-map-button right-3 top-3"
          aria-label="Centrar la ruta"
          onClick={() => setFitKey((key) => key + 1)}
        >
          <TargetIcon className="h-6 w-6" />
        </button>
      </div>

      <section className="publish-sheet">
        <span className="publish-sheet-handle" aria-hidden="true" />

        <div className="publish-card flex items-center gap-3">
          <DriverAvatar
            name={driver.name}
            photoUrl={driver.photoUrl}
            className="driver-avatar h-14 w-14"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight text-[var(--text-primary)]">
              {driver.name}
            </p>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              {driver.rating ? (
                <>
                  <span className="text-amber-500">★</span>{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {driver.rating.average}
                  </span>{" "}
                  ({driver.rating.count}{" "}
                  {driver.rating.count === 1 ? "reseña" : "reseñas"})
                </>
              ) : (
                "Sin reseñas todavía"
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <p className="flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)]">
              <GaugeIcon className="h-4 w-4 text-[var(--text-muted)]" />
              {ride.distanceKm.toFixed(1)} km
            </p>
            <p className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm">
              <GoldCoinIcon className="h-5 w-5" />
              <span className="text-xl font-bold leading-none text-[var(--text-primary)]">
                {ride.pricePerSeat}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {ride.pricePerSeat === 1 ? "crédito" : "créditos"}
              </span>
            </p>
          </div>
        </div>

        <ol className="publish-card ride-timeline">
          <li className="ride-timeline-item">
            <span className="ride-timeline-dot border-[5px] border-[var(--brand-red)] bg-white" />
            <p className="ride-timeline-label text-[var(--brand-red)]">
              Punto de partida{" "}
              <span className="ride-timeline-time">
                • {formatLimaTime12h(departure)}, {getLimaDayLabel(departure)}
              </span>
            </p>
            <p className="ride-timeline-place">{ride.origin.label}</p>
            {ride.origin.address ? (
              <p className="ride-timeline-address">{ride.origin.address}</p>
            ) : null}
          </li>

          {ride.stops.map((stop, index) => (
            <li key={`${stop.label}-${index}`} className="ride-timeline-item">
              <span className="ride-timeline-dot border-2 border-[var(--text-muted)] bg-white" />
              <p className="ride-timeline-label text-[var(--text-muted)]">
                Parada {index + 1}
              </p>
              <p className="ride-timeline-place">{stop.label}</p>
              {stop.address ? (
                <p className="ride-timeline-address">{stop.address}</p>
              ) : null}
            </li>
          ))}

          <li className="ride-timeline-item">
            <span className="ride-timeline-dot bg-[#2f2f2f] text-white">
              <FlagIcon className="h-2.5 w-2.5" />
            </span>
            <p className="ride-timeline-label text-[var(--text-muted)]">
              Destino{" "}
              <span className="ride-timeline-time">
                • Aprox. {formatLimaTime12h(arrival)}
              </span>
            </p>
            <p className="ride-timeline-place">{ride.destination.label}</p>
            {ride.destination.address ? (
              <p className="ride-timeline-address">{ride.destination.address}</p>
            ) : null}
          </li>
        </ol>

        <div className="publish-card space-y-2.5">
          <div className="flex items-center gap-2">
            <CarIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
            <p className="min-w-0 flex-1 truncate text-[0.9375rem] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">
                {vehicle.brand} {vehicle.model}
              </span>{" "}
              • {vehicle.color}
            </p>
            <span className="shrink-0 rounded-md bg-[#e2e2e2] px-2 py-0.5 text-xs font-semibold tracking-wide text-[var(--text-primary)]">
              {vehicle.plate}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[0.9375rem] text-[var(--text-primary)]">
              <PassengersIcon className="h-5 w-5 text-[var(--brand-red)]" />
              <span>
                <span className="font-bold text-[var(--brand-red)]">
                  {ride.availableSeats}
                </span>{" "}
                {ride.availableSeats === 1
                  ? "asiento disponible"
                  : "asientos disponibles"}
              </span>
            </p>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-[var(--text-muted)]"
              onClick={() => setShowConditions(true)}
            >
              <InfoIcon className="h-4 w-4" />
              Condiciones
            </button>
          </div>
        </div>

        {hasReserved ? (
          <p className="dashboard-message" role="status">
            Reserva confirmada. Tu asiento en este viaje está separado.
          </p>
        ) : null}

        {reserveMutation.isError || (unavailableReason && !hasReserved) ? (
          <div className="auth-message auth-message-error mb-0" role="alert">
            {reserveMutation.error instanceof Error
              ? reserveMutation.error.message
              : unavailableReason}
          </div>
        ) : null}

        {hasReserved ? (
          <Link to="/dashboard" className="auth-button-secondary mt-0">
            Volver a los viajes
          </Link>
        ) : (
          <button
            type="button"
            className="auth-button-primary mt-0 gap-2 text-xl"
            disabled={Boolean(unavailableReason)}
            onClick={() => {
              reserveMutation.reset();
              setIsConfirming(true);
            }}
          >
            Reservar viaje
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        )}
      </section>

      {isConfirming ? (
        <ReserveRideConfirmModal
          ride={ride}
          isReserving={reserveMutation.isPending}
          onConfirm={() => reserveMutation.mutate()}
          onCancel={() => setIsConfirming(false)}
        />
      ) : null}

      {showConditions ? (
        <RideConditionsModal
          conditions={ride.conditions}
          onClose={() => setShowConditions(false)}
        />
      ) : null}
    </div>
  );
}
