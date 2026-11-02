import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { ReserveRideConfirmModal } from "@/features/rides/components/ReserveRideConfirmModal";
import { RideRouteMap } from "@/features/rides/components/RideRouteMap";
import { rideService } from "@/features/rides/services/rideService";
import type { MyBooking, Place } from "@/features/rides/types";
import {
  formatDepartureDay,
  formatDepartureTime,
  formatKm,
} from "@/features/rides/utils/route";
import { ApiError } from "@/shared/api/apiClient";
import { CarIcon, GoldCoinIcon } from "@/shared/icons";
import { formatDepartureLabel, formatLimaDayMonth } from "@/shared/utils/limaTime";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import ArrowLeftIcon from "@/assets/images/icons/arrow-left.svg?react";
import ArrowRightIcon from "@/assets/images/icons/arrow-right.svg?react";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import MapPinIcon from "@/assets/images/icons/map-pin.svg?react";
import RideIcon from "@/assets/images/icons/ride.svg?react";
import RulerIcon from "@/assets/images/icons/ruler.svg?react";
import SeatIcon from "@/assets/images/icons/passenger.svg?react";
import ShieldCheckIcon from "@/assets/images/icons/shield-check.svg?react";
import TargetIcon from "@/assets/images/icons/target.svg?react";

const MINUTE_MS = 60 * 1000;
const TOAST_MS = 3000;
const BLOCKED_REASON_ID = "ride-detail-blocked-reason";

// El viaje no existe, o el identificador de la URL no es válido.
const isMissingRide = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 400);

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

/** Lugar de la lista de la ruta: «Campus UTP Trujillo — Av. Nicolás de Piérola 1221». */
const placeText = (place: Place) =>
  place.address ? `${place.label} — ${place.address}` : place.label;

const BOOKING_STATUS: Record<MyBooking["status"], { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmada", className: "status-chip" },
  IN_RIDE: { label: "En viaje", className: "status-chip status-chip-green" },
};

/** Detalle del viaje (P09, frames 09-A a 09-D). */
export function RideDetailPage() {
  const { rideId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [fitKey, setFitKey] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const rideQuery = useQuery({
    queryKey: ["rides", rideId],
    queryFn: () => rideService.getRide(rideId),
    retry: (failureCount, error) => !isMissingRide(error) && failureCount < 1,
  });

  // El conductor también abre sus viajes desde el dashboard (06-F): no puede reservarlos.
  const userQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: dashboardService.getCurrentUser,
  });

  const reserveMutation = useMutation({
    mutationFn: () => dashboardService.reserveRide(rideId),
    onSuccess: () => setShowToast(true),
    onSettled: () => {
      setIsConfirming(false);
      // Con éxito pasa a 09-B; con error pudo cambiar el estado o las plazas: se refresca todo.
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  useEffect(() => {
    if (!showToast) {
      return;
    }
    const timer = window.setTimeout(() => setShowToast(false), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  // «←» vuelve a la pantalla de origen (P06 o P17); si se abrió directo, al dashboard.
  const goBack = () =>
    location.key === "default" ? navigate("/dashboard") : navigate(-1);

  const header = (
    <header className="publish-header">
      <button
        type="button"
        className="publish-header-button"
        aria-label="Volver"
        onClick={goBack}
      >
        <ArrowLeftIcon className="h-6 w-6" />
      </button>
      <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">
        Detalle del viaje
      </h1>
    </header>
  );

  const renderCentered = (content: ReactNode) => (
    <div className="publish-screen">
      {header}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 pb-16">
        {content}
      </div>
    </div>
  );

  if (rideQuery.isLoading || userQuery.isLoading) {
    return (
      <div className="publish-screen">
        {header}
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Cargando el viaje...
        </p>
      </div>
    );
  }

  const ride = rideQuery.data;

  if (!ride && !isMissingRide(rideQuery.error)) {
    return renderCentered(
      <div className="dashboard-alert" role="alert">
        <p className="flex-1">No pudimos cargar el viaje</p>
        <button
          type="button"
          className="shrink-0 font-semibold underline"
          onClick={() => rideQuery.refetch()}
        >
          Reintentar
        </button>
      </div>,
    );
  }

  const departure = ride ? new Date(ride.departureTime) : null;
  const isOwnRide = Boolean(ride && userQuery.data && ride.driver.id === userQuery.data.id);
  // Un viaje propio no se reserva: las restricciones del pasajero no aplican.
  const myBooking = isOwnRide ? null : (ride?.myBooking ?? null);
  // 09-D: ya no se puede reservar y no es una reserva propia (que se ve en modo lectura).
  // El conductor ve su viaje mientras esté publicado o en curso, aunque ya no tenga asientos.
  const isUnavailable =
    !ride ||
    !departure ||
    (isOwnRide
      ? ride.status !== "PUBLISHED" && ride.status !== "IN_PROGRESS"
      : !myBooking &&
        (ride.status !== "PUBLISHED" ||
          departure.getTime() <= Date.now() ||
          ride.availableSeats < 1));

  if (isUnavailable) {
    return renderCentered(
      <div className="publish-blocked-card px-4">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-red)]">
          <RideIcon className="h-8 w-8" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[var(--brand-red)] text-white">
            <CloseIcon className="h-3.5 w-3.5" />
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          Este viaje ya no está disponible
        </h2>
        <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
          Puede que el conductor lo haya cancelado, que ya haya salido o que no queden
          asientos.
        </p>
        <Link to="/dashboard" className="publish-submit mt-6 gap-2">
          Ver otros viajes
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
      </div>,
    );
  }

  const { driver, vehicle, activeBooking, bookingBlock } = ride;
  // La duración la calcula el backend a 35 km/h sobre la distancia en línea recta (RF-03).
  const arrival = new Date(departure.getTime() + ride.durationMin * MINUTE_MS);
  const city = ride.campus?.city;
  const isBlocked = Boolean(bookingBlock || activeBooking);
  const cancellableUntil = myBooking ? new Date(myBooking.cancellableUntil) : null;

  return (
    <div className="publish-screen">
      {header}

      <div className="publish-map h-[17.5rem] min-h-0">
        <RideRouteMap
          origin={ride.origin}
          stops={ride.stops}
          destination={ride.destination}
          direction={ride.direction}
          fitKey={fitKey}
        />

        <p className="publish-map-chip right-3 top-3">
          <RulerIcon className="h-4 w-4 text-[var(--text-primary)]" />
          <span className="tabular-nums text-[var(--text-primary)]">
            {formatKm(ride.distanceKm)} · ~{ride.durationMin} min
          </span>
        </p>

        <button
          type="button"
          className="publish-map-button bottom-7 right-3"
          aria-label="Centrar la ruta"
          onClick={() => setFitKey((key) => key + 1)}
        >
          <TargetIcon className="h-6 w-6" />
        </button>
      </div>

      <section className="ride-detail-sheet">
        <span className="publish-sheet-handle" aria-hidden="true" />

        {myBooking && cancellableUntil ? (
          <div className="ride-detail-card-outlined">
            <div className="flex items-center justify-between gap-3">
              <p className="publish-label">Tu reserva</p>
              <span className={BOOKING_STATUS[myBooking.status].className}>
                {BOOKING_STATUS[myBooking.status].label}
              </span>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              <span className="flex items-center gap-1.5">
                <SeatIcon className="h-5 w-5 text-[var(--text-muted)]" />
                {plural(myBooking.seats, "plaza", "plazas")}
              </span>
              <span className="text-[var(--text-muted)]" aria-hidden="true">
                ·
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <GoldCoinIcon className="h-5 w-5" />
                {plural(myBooking.totalCredits, "crédito retenido", "créditos retenidos")}
              </span>
            </p>
            {myBooking.status === "CONFIRMED" ? (
              <p className="mt-2 flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {cancellableUntil.getTime() > Date.now()
                  ? `Puedes cancelar gratis hasta las ${formatDepartureTime(cancellableUntil)} desde Mis viajes.`
                  : "Ya no puedes cancelar: faltan menos de 30 minutos para la salida"}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="ride-detail-card">
          <div className="flex items-center gap-3">
            <DriverAvatar
              name={driver.name}
              photoUrl={driver.photoUrl}
              className="ride-detail-avatar"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight text-[var(--text-primary)]">
                {driver.name}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {driver.rating ? (
                  <>
                    <span className="text-amber-500">★</span> {driver.rating.average} (
                    {plural(driver.rating.count, "reseña", "reseñas")})
                  </>
                ) : (
                  "Sin reseñas todavía"
                )}
              </p>
            </div>
          </div>
          <p className="mt-3 flex items-baseline gap-2 rounded-xl bg-white px-3 py-2.5">
            <GoldCoinIcon className="h-5 w-5 self-center" />
            <span className="text-2xl font-semibold leading-none tabular-nums text-[var(--text-primary)]">
              {ride.pricePerSeat}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {ride.pricePerSeat === 1 ? "crédito" : "créditos"} por plaza
            </span>
          </p>
        </div>

        <div className="ride-detail-card">
          <div className="flex items-center justify-between gap-3">
            {city ? (
              <span className="ride-detail-city">
                <MapPinIcon className="h-4 w-4" />
                {city}
              </span>
            ) : (
              <span />
            )}
            <p className="text-[0.9375rem] text-[var(--text-primary)]">
              {formatDepartureDay(departure)}
            </p>
          </div>

          <p className="publish-label mt-4">Salida</p>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[1.75rem] font-bold leading-tight tabular-nums text-[var(--text-primary)]">
              {formatDepartureTime(departure)}
            </p>
            <p className="text-[0.9375rem] tabular-nums text-[var(--text-muted)]">
              Llegada aprox. {formatDepartureTime(arrival)}
            </p>
          </div>

          <p className="publish-label mt-4">Ruta</p>
          <ol className="ride-detail-route">
            <li className="ride-detail-route-item">
              <span className="ride-detail-route-dot border-2 border-[var(--brand-red)] bg-white" />
              {placeText(ride.origin)}
            </li>
            {ride.stops.map((stop, index) => (
              <li key={`${stop.label}-${index}`} className="ride-detail-route-item">
                <span className="ride-detail-route-dot bg-[var(--brand-red)]" />
                Parada {index + 1} · {stop.label}
              </li>
            ))}
            <li className="ride-detail-route-item">
              <span className="ride-detail-route-dot bg-[var(--brand-red)]" />
              {placeText(ride.destination)}
            </li>
          </ol>
          <p className="mt-3 flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-muted)]">
            <InfoIcon className="h-4 w-4 shrink-0" />
            Paradas referenciales definidas por el conductor
          </p>
          <p className="mt-2 text-[0.9375rem] tabular-nums text-[var(--text-muted)]">
            {formatKm(ride.distanceKm)} en línea recta · ~{ride.durationMin} min
          </p>
        </div>

        <div className="ride-detail-card">
          <div className="flex items-center gap-2">
            <CarIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
            <p className="min-w-0 flex-1 text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              {vehicle.brand} {vehicle.model} • {vehicle.color}
            </p>
            <span className="shrink-0 rounded-md bg-[var(--border-neutral)] px-2 py-1 text-xs font-semibold tracking-wide text-[var(--text-primary)]">
              {vehicle.plate}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-[0.9375rem] text-[var(--text-primary)]">
            <SeatIcon className="h-5 w-5 text-[var(--brand-red)]" />
            {ride.availableSeats === 1 ? "1 asiento libre" : `${ride.availableSeats} asientos libres`}{" "}
            de {ride.totalSeats}
          </p>
          {vehicle.wheelchairAccessible || vehicle.soatEndDate ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {vehicle.wheelchairAccessible ? (
                <span
                  className="ride-detail-chip bg-[#e6f4ea] text-[#1b7f3b]"
                  aria-label="Vehículo apto para silla de ruedas plegable"
                >
                  <AccessibleIcon className="h-4 w-4" aria-hidden="true" />
                  Apto para silla de ruedas
                </span>
              ) : null}
              {/* RN-36: el chip aparece si el conductor declaró su SOAT. */}
              {vehicle.soatEndDate ? (
                <span className="ride-detail-chip bg-[var(--border-neutral)] text-[var(--text-brown)]">
                  <ShieldCheckIcon className="h-4 w-4" />
                  SOAT declarado por el conductor
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="ride-detail-card-outlined">
          <p className="publish-label">Condiciones del viaje</p>
          {ride.conditions.length ? (
            <ul className="mt-3 space-y-2.5">
              {ride.conditions.map((condition, index) => (
                <li
                  key={`${condition}-${index}`}
                  className="flex items-start gap-2.5 text-[0.9375rem] text-[var(--text-primary)]"
                >
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                  {condition}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[0.9375rem] text-[var(--text-muted)]">
              Sin condiciones adicionales
            </p>
          )}
        </div>
      </section>

      {/* `sticky`: el contenido termina justo encima de la barra, también con la franja de 09-C. */}
      <footer className="ride-detail-bar">
        {myBooking || isOwnRide ? (
          // 09-B y viaje propio: modo lectura; se cancela o se inicia en Mis viajes.
          <Link to="/mis-viajes" className="ride-detail-secondary-button">
            Ir a Mis viajes
          </Link>
        ) : (
          <>
            {bookingBlock ? (
              <div id={BLOCKED_REASON_ID} className="dashboard-alert" role="status">
                <LockIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Cancelaste o no te presentaste a {bookingBlock.count} viajes en los
                  últimos 30 días. Podrás reservar de nuevo desde el{" "}
                  {formatLimaDayMonth(new Date(bookingBlock.until))}.
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
                  <Link
                    to="/mis-viajes"
                    className="mt-1 inline-block text-sm font-semibold text-[var(--brand-red)]"
                  >
                    Ver en Mis viajes
                  </Link>
                </div>
              </div>
            ) : null}

            {reserveMutation.isError ? (
              <div className="dashboard-alert" role="alert">
                <p>
                  {reserveMutation.error instanceof Error
                    ? reserveMutation.error.message
                    : "No pudimos reservar el viaje"}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              className="ride-reserve-button mt-0 gap-2"
              aria-disabled={isBlocked}
              aria-describedby={isBlocked ? BLOCKED_REASON_ID : undefined}
              onClick={() => {
                if (isBlocked) {
                  return;
                }
                reserveMutation.reset();
                setIsConfirming(true);
              }}
            >
              Reservar viaje
              {isBlocked ? null : <ArrowRightIcon className="h-5 w-5" />}
            </button>
            {isBlocked ? null : (
              <p className="text-center text-[0.8125rem] text-[var(--text-muted)]">
                Cancelación gratuita hasta 30 min antes del viaje
              </p>
            )}
          </>
        )}
      </footer>

      {showToast ? (
        <p className="app-toast" role="status">
          Reserva confirmada
        </p>
      ) : null}

      {isConfirming ? (
        <ReserveRideConfirmModal
          ride={ride}
          isReserving={reserveMutation.isPending}
          onConfirm={() => reserveMutation.mutate()}
          onCancel={() => setIsConfirming(false)}
        />
      ) : null}
    </div>
  );
}
