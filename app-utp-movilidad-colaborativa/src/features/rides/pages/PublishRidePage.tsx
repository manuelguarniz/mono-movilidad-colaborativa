import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DiscardRideSheet } from "@/features/rides/components/DiscardRideSheet";
import { PublishRideConfirmModal } from "@/features/rides/components/PublishRideConfirmModal";
import { RouteMap } from "@/features/rides/components/RouteMap";
import { rideService } from "@/features/rides/services/rideService";
import type {
  GeoPoint,
  Place,
  RideDirection,
  RoutePoint,
} from "@/features/rides/types";
import {
  MAX_CONDITIONS,
  MAX_CONDITION_LENGTH,
  MAX_PRICE,
  MAX_STOPS,
  MIN_PRICE,
  createRoutePoint,
  findStopPosition,
  formatDepartureDay,
  formatDepartureTime,
  formatKm,
  fromLimaInputValue,
  getDefaultDeparture,
  isDepartureValid,
  measureRoute,
  toLimaInputValue,
} from "@/features/rides/utils/route";
import { ApiError } from "@/shared/api/apiClient";
import { GoldCoinIcon } from "@/shared/icons";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import AlertIcon from "@/assets/images/icons/alert-circle.svg?react";
import CapIcon from "@/assets/images/icons/graduation-cap.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";
import HomeIcon from "@/assets/images/icons/home.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import SeatIcon from "@/assets/images/icons/passenger.svg?react";
import TapIcon from "@/assets/images/icons/tap.svg?react";
import TargetIcon from "@/assets/images/icons/target.svg?react";
import WarningIcon from "@/assets/images/icons/warning.svg?react";

const DIRECTIONS: Array<{ value: RideDirection; label: string; icon: ReactNode }> = [
  {
    value: "TO_CAMPUS",
    label: "Ida a la universidad",
    icon: <CapIcon className="h-5 w-5 shrink-0" />,
  },
  {
    value: "TO_HOME",
    label: "Regreso a casa",
    icon: <HomeIcon className="h-5 w-5 shrink-0" />,
  },
];

const DEFAULT_PRICE = 5;
const MAX_LABEL_LENGTH = 80;
const VEHICLE_PATH = "/perfil/vehiculo";
const PUBLISH_PATH = "/viajes/publicar";

// Mensajes de validación de P11 (docs/design/P11-PublicarViaje/prompt.md).
const MESSAGES = {
  noVehicle: "Registra un vehículo para usar la modalidad de conductor (o para publicar viajes)",
  departure: "Elige una salida futura entre las 06:00 y las 23:00.",
  soat: "Tu SOAT vence antes de la salida. Actualízalo en tu perfil para publicar.",
  route: "Toca el mapa para fijar el origen y el destino.",
  routeNames: "Escribe el nombre de cada punto de la ruta.",
  maxStops: `Puedes agregar hasta ${MAX_STOPS} paradas.`,
  maxConditions: `Puedes agregar hasta ${MAX_CONDITIONS} condiciones.`,
  conditionLength: `Escribe la condición en ${MAX_CONDITION_LENGTH} caracteres o menos.`,
};

// El formulario se guarda al abrir «Actualizar vehículo» (P16) y se recupera al volver.
const DRAFT_KEY = "publish-ride-draft";

type Draft = {
  direction: RideDirection;
  departure: string;
  pricePerSeat: number;
  selectedSeats: number | null;
  home: RoutePoint | null;
  stops: RoutePoint[];
  conditions: string[];
};

function readDraft(): Draft | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  try {
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

const isNotFound = (error: unknown) =>
  error instanceof ApiError && error.status === 404;

/** `2026-11-14T05:00:00Z` → `14/11`, en la hora de Perú. */
const formatShortDate = (iso: string) =>
  toLimaInputValue(new Date(iso)).slice(5, 10).split("-").reverse().join("/");

export function PublishRidePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft] = useState(readDraft);

  // El borrador solo sirve para volver una vez desde P16.
  useEffect(() => {
    sessionStorage.removeItem(DRAFT_KEY);
  }, []);

  const [direction, setDirection] = useState<RideDirection>(
    draft?.direction ?? "TO_CAMPUS",
  );
  const [departure, setDeparture] = useState(() =>
    draft ? new Date(draft.departure) : getDefaultDeparture(),
  );
  const [pricePerSeat, setPricePerSeat] = useState(draft?.pricePerSeat ?? DEFAULT_PRICE);
  // `null`: todavía no se eligió; se ofrecen las plazas del vehículo menos una.
  const [selectedSeats, setSelectedSeats] = useState<number | null>(
    draft?.selectedSeats ?? null,
  );
  // La casa es el extremo de la ruta que marca el conductor; el otro es la sede.
  const [home, setHome] = useState<RoutePoint | null>(draft?.home ?? null);
  // Paradas en orden de la casa a la sede.
  const [stops, setStops] = useState<RoutePoint[]>(draft?.stops ?? []);
  const [conditions, setConditions] = useState<string[]>(draft?.conditions ?? []);
  const [conditionDraft, setConditionDraft] = useState("");
  const [conditionError, setConditionError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isDirty, setIsDirty] = useState(Boolean(draft));
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [fitKey, setFitKey] = useState(0);

  // Solo los usuarios con vehículo pueden publicar (RN-24).
  const vehicleQuery = useQuery({
    queryKey: ["vehicles", "me"],
    queryFn: rideService.getMyVehicle,
    retry: (failureCount, queryError) => !isNotFound(queryError) && failureCount < 1,
  });

  const profileQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: rideService.getMyProfile,
  });

  const profile = profileQuery.data;
  const districtId = profile?.district?.id;
  const campusId = profile?.campus?.id;

  const campusQuery = useQuery({
    queryKey: ["catalogs", "campus", districtId, campusId],
    queryFn: () => rideService.getCampus(districtId!, campusId!),
    enabled: Boolean(districtId && campusId),
  });

  const vehicle = vehicleQuery.data;
  const campus = campusQuery.data;
  const vehicleSeats = vehicle?.seats ?? 1;
  const seats = Math.min(selectedSeats ?? Math.max(1, vehicleSeats - 1), vehicleSeats);

  // Con «Ida a la universidad», el origen se precarga con la residencia del perfil.
  const homeAddress = profile?.homeAddress;
  useEffect(() => {
    if (homeAddress) {
      setHome((current) =>
        current ?? createRoutePoint(homeAddress.label, homeAddress.location),
      );
      setFitKey((key) => key + 1);
    }
  }, [homeAddress]);

  const publishMutation = useMutation({
    mutationFn: rideService.publishRide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      navigate("/dashboard", { replace: true, state: { ridePublished: true } });
    },
    onError: (mutationError) => {
      setIsConfirming(false);
      setSubmitError(
        mutationError instanceof Error
          ? mutationError.message
          : "No se pudo publicar el viaje",
      );
    },
  });

  const leave = () => navigate("/dashboard");

  const handleExit = () => {
    if (isDirty) {
      setIsDiscarding(true);
    } else {
      leave();
    }
  };

  const header = (
    <header className="publish-header">
      <button
        type="button"
        className="publish-header-button"
        aria-label="Cerrar"
        onClick={handleExit}
      >
        <CloseIcon className="h-6 w-6" />
      </button>
      <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">
        Publicar viaje
      </h1>
    </header>
  );

  // Frame 11-C: la pantalla entera se bloquea (sin vehículo o por cancelaciones).
  const renderBlocked = (
    icon: ReactNode,
    title: string,
    message: string,
    children: ReactNode,
  ) => (
    <div className="publish-screen">
      {header}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-[var(--webview-px)] pb-16">
        <div className="publish-blocked-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-red)]">
            {icon}
          </div>
          <h2 className="mt-5 text-[1.375rem] font-semibold leading-tight text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">
            {message}
          </p>
          {children}
        </div>
      </div>
    </div>
  );

  if (vehicleQuery.isLoading || profileQuery.isLoading || campusQuery.isLoading) {
    return (
      <div className="publish-screen">
        {header}
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Cargando tus datos...
        </p>
      </div>
    );
  }

  if (isNotFound(vehicleQuery.error)) {
    return renderBlocked(
      <CarIcon className="h-7 w-7" />,
      "Registra un vehículo",
      MESSAGES.noVehicle,
      <>
        <Link
          to={VEHICLE_PATH}
          state={{ returnTo: PUBLISH_PATH }}
          className="publish-submit mt-6"
        >
          Registrar vehículo
        </Link>
        <button type="button" className="publish-secondary-button mt-3" onClick={leave}>
          Volver
        </button>
      </>,
    );
  }

  const loadError = vehicleQuery.error ?? profileQuery.error ?? campusQuery.error;
  if (loadError || !vehicle || !profile) {
    return renderBlocked(
      <AlertIcon className="h-7 w-7" />,
      "No se pudieron cargar tus datos",
      loadError instanceof Error ? loadError.message : "Inténtalo nuevamente.",
      <button
        type="button"
        className="publish-submit mt-6"
        onClick={() => {
          vehicleQuery.refetch();
          profileQuery.refetch();
          campusQuery.refetch();
        }}
      >
        Reintentar
      </button>,
    );
  }

  const block = profile.cancellationBlock;
  if (block) {
    return renderBlocked(
      <LockIcon className="h-7 w-7" />,
      "Por ahora no puedes publicar viajes",
      `Cancelaste ${block.count} viajes en los últimos 30 días. Podrás publicar de nuevo desde el ${formatShortDate(block.until)}.`,
      <>
        <p className="mt-6 flex items-start gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-left text-sm text-[var(--text-muted)]">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0" />
          Cuentan los viajes que cancelaste y los que se cancelaron porque no los
          iniciaste.
        </p>
        <button type="button" className="publish-secondary-button" onClick={leave}>
          Volver
        </button>
      </>,
    );
  }

  if (!campus?.location) {
    return renderBlocked(
      <AlertIcon className="h-7 w-7" />,
      "No encontramos la ubicación de tu sede",
      "La sede es un extremo de la ruta y la API no devolvió sus coordenadas.",
      <button type="button" className="publish-secondary-button" onClick={leave}>
        Volver
      </button>,
    );
  }

  const campusLocation = campus.location;
  const campusPlace: Place = {
    label: campus.name,
    address: campus.address ?? profile.campus?.address ?? null,
    location: campusLocation,
  };

  // Recorrido en el orden del viaje: la sede es el destino en la ida y el origen en el regreso.
  const isToCampus = direction === "TO_CAMPUS";
  const orderedStops = isToCampus ? stops : [...stops].reverse();
  const routeLocations = [
    ...(home ? [home.location] : []),
    ...stops.map((stop) => stop.location),
    campusLocation,
  ];
  const { distanceKm, durationMin } = measureRoute(routeLocations);
  const directionLabel = DIRECTIONS.find((item) => item.value === direction)!.label;
  const departureTime = formatDepartureTime(departure);
  const departureDay = formatDepartureDay(departure);

  // RN-12 y RN-37 dependen de la fecha elegida: se marcan en el formulario (frame 11-B).
  const departureError = isDepartureValid(departure) ? "" : MESSAGES.departure;
  // Sin SOAT declarado no se valida: es opcional mientras P05 y P16 no lo pidan.
  const departureDate = toLimaInputValue(departure).slice(0, 10);
  const soat = vehicle.soat;
  const soatError =
    soat && (departureDate < soat.startDate || departureDate > soat.endDate)
      ? MESSAGES.soat
      : "";
  const isWheelchairAccessible = vehicle.accessibility.wheelchair;

  const edit = () => {
    setIsDirty(true);
    setSubmitError("");
  };

  // Antes de abrir P16 se guarda el formulario para recuperarlo al volver.
  const saveDraft = () => {
    const value: Draft = {
      direction,
      departure: departure.toISOString(),
      pricePerSeat,
      selectedSeats,
      home,
      stops,
      conditions,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value));
  };

  const handleMapTap = (location: GeoPoint) => {
    edit();
    setRouteError("");
    if (!home) {
      setHome(createRoutePoint("", location));
      return;
    }
    if (stops.length >= MAX_STOPS) {
      setRouteError(MESSAGES.maxStops);
      return;
    }
    // La parada se inserta en el tramo donde menos alarga el recorrido.
    const position = findStopPosition(routeLocations, location);
    setStops((current) => [
      ...current.slice(0, position),
      createRoutePoint("", location),
      ...current.slice(position),
    ]);
  };

  const updatePoint = (pointId: string, changes: Partial<RoutePoint>) => {
    edit();
    setRouteError("");
    if (home?.id === pointId) {
      setHome({ ...home, ...changes });
      return;
    }
    setStops((current) =>
      current.map((stop) => (stop.id === pointId ? { ...stop, ...changes } : stop)),
    );
  };

  const removeStop = (pointId: string) => {
    edit();
    setRouteError("");
    setStops((current) => current.filter((stop) => stop.id !== pointId));
  };

  const addCondition = () => {
    const condition = conditionDraft.trim();
    if (!condition) {
      return;
    }
    if (conditions.length >= MAX_CONDITIONS) {
      setConditionError(MESSAGES.maxConditions);
      return;
    }
    if (condition.length > MAX_CONDITION_LENGTH) {
      setConditionError(MESSAGES.conditionLength);
      return;
    }
    edit();
    setConditions([...conditions, condition]);
    setConditionDraft("");
    setConditionError("");
  };

  const handleSubmit = () => {
    const nextRouteError = !home
      ? MESSAGES.route
      : [home, ...stops].some((point) => !point.label.trim())
        ? MESSAGES.routeNames
        : "";
    setRouteError(nextRouteError);
    if (!nextRouteError && !departureError && !soatError) {
      setIsConfirming(true);
    }
  };

  const handleConfirm = () => {
    const toPlace = (point: RoutePoint): Place => ({
      label: point.label.trim(),
      location: point.location,
    });
    const homePlace = toPlace(home!);

    publishMutation.mutate({
      direction,
      departureTime: departure.toISOString(),
      origin: isToCampus ? homePlace : campusPlace,
      destination: isToCampus ? campusPlace : homePlace,
      stops: orderedStops.map(toPlace),
      pricePerSeat,
      seats,
      conditions,
    });
  };

  const campusItem = (isOrigin: boolean) => (
    <li key="campus" className="publish-route-item">
      <span
        className={
          isOrigin
            ? "publish-route-dot border-[2.5px] border-[var(--brand-red)] bg-white"
            : "publish-route-dot text-[var(--brand-red)]"
        }
      >
        {isOrigin ? null : <CapIcon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-[0.9375rem] text-[var(--text-primary)]">
          <span
            className={
              isOrigin ? "font-semibold" : "font-semibold text-[var(--brand-red)]"
            }
          >
            {isOrigin ? "Origen" : "Destino"}
          </span>{" "}
          · {campus.name}
        </p>
        {campusPlace.address ? (
          <p className="text-sm font-medium text-[var(--text-brown)]">
            {campusPlace.address}
          </p>
        ) : null}
      </div>
    </li>
  );

  const homeItem = (isOrigin: boolean) => (
    <li key="home" className="publish-route-item">
      <span
        className={
          isOrigin
            ? "publish-route-dot border-[2.5px] border-[var(--brand-red)] bg-white"
            : "publish-route-dot bg-[var(--brand-red)] text-white"
        }
      >
        {isOrigin ? null : <HomeIcon className="h-3 w-3" />}
      </span>
      <span
        className={
          isOrigin
            ? "shrink-0 text-[0.9375rem] font-semibold text-[var(--text-primary)]"
            : "shrink-0 text-[0.9375rem] font-semibold text-[var(--brand-red)]"
        }
      >
        {isOrigin ? "Origen" : "Destino"} ·
      </span>
      {home ? (
        <input
          type="text"
          value={home.label}
          maxLength={MAX_LABEL_LENGTH}
          placeholder={isOrigin ? "Nombre del origen" : "Nombre del destino"}
          aria-label={isOrigin ? "Nombre del origen" : "Nombre del destino"}
          className="publish-route-input"
          onChange={(event) => updatePoint(home.id, { label: event.target.value })}
        />
      ) : (
        <span className="text-[0.9375rem] text-[var(--text-muted)]">
          Toca el mapa para fijarlo
        </span>
      )}
    </li>
  );

  const stopItems = orderedStops.map((stop, index) => (
    <li key={stop.id} className="publish-route-item">
      <span className="publish-route-dot bg-[var(--brand-red)] text-white">
        {index + 1}
      </span>
      <span className="shrink-0 text-[0.9375rem] font-semibold text-[var(--text-primary)]">
        Parada {index + 1} ·
      </span>
      <input
        type="text"
        value={stop.label}
        maxLength={MAX_LABEL_LENGTH}
        placeholder="Nombre de la parada"
        aria-label={`Nombre de la parada ${index + 1}`}
        className="publish-route-input"
        onChange={(event) => updatePoint(stop.id, { label: event.target.value })}
      />
      <button
        type="button"
        className="publish-icon-button"
        aria-label={`Quitar la parada ${index + 1}`}
        onClick={() => removeStop(stop.id)}
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </li>
  ));

  const routeNames = [
    isToCampus ? home?.label.trim() ?? "" : campus.name,
    ...orderedStops.map((stop) => stop.label.trim()),
    isToCampus ? campus.name : home?.label.trim() ?? "",
  ];

  return (
    <div className="publish-screen">
      {header}

      <div className="publish-map">
        <RouteMap
          campus={{ label: campus.name, location: campusLocation }}
          home={home}
          stops={stops}
          direction={direction}
          fitKey={fitKey}
          onTap={handleMapTap}
          onMovePoint={(pointId, location) => updatePoint(pointId, { location })}
        />

        {home ? (
          <p className="publish-map-chip right-3 top-3 font-semibold text-[var(--text-primary)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-red)]" />
            <span className="tabular-nums">
              {formatKm(distanceKm)} · ~{durationMin} min
            </span>
          </p>
        ) : null}

        <p className="publish-map-chip bottom-7 left-3 max-w-[75%]">
          <TapIcon className="h-5 w-5 shrink-0 text-[var(--brand-red)]" />
          <span className="leading-tight text-[var(--text-primary)]">
            Toca el mapa para agregar o mover paradas
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

      <section className="publish-sheet gap-5">
        <span className="publish-sheet-handle" aria-hidden="true" />

        <div
          className="publish-segment -mt-2"
          role="radiogroup"
          aria-label="Sentido del viaje"
        >
          {DIRECTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={direction === item.value}
              className={
                direction === item.value
                  ? "publish-segment-option publish-segment-option-active"
                  : "publish-segment-option"
              }
              onClick={() => {
                edit();
                setDirection(item.value);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* La accesibilidad es del vehículo (RN-18): solo se muestra. */}
        <div className="publish-vehicle">
          <p className="flex items-center gap-2.5 text-base font-semibold text-[var(--text-primary)]">
            <CarIcon className="h-6 w-6 shrink-0 text-[var(--text-muted)]" />
            <span>
              {vehicle.brand} {vehicle.model} {vehicle.color?.toLowerCase()} •{" "}
              {vehicle.plate} · {vehicle.seats}{" "}
              {vehicle.seats === 1 ? "plaza" : "plazas"}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isWheelchairAccessible ? (
              <span className="publish-chip bg-[#e6f4ea] text-[#1b7f3b]">
                <AccessibleIcon className="h-4 w-4" />
                Apto para silla de ruedas
              </span>
            ) : null}
            <span className="publish-chip bg-[var(--surface-muted)] text-[var(--text-muted)]">
              {campus.name}
            </span>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 items-start gap-3">
            <div>
              <div
                className={
                  departureError ? "publish-block publish-block-error" : "publish-block"
                }
              >
                <label htmlFor="publish-departure" className="publish-label">
                  Salida
                </label>
                {/* El selector nativo de fecha y hora cubre todo el bloque. */}
                <div className="relative">
                  <p
                    className={
                      departureError
                        ? "mt-1 text-[1.75rem] font-semibold leading-tight tabular-nums text-[var(--brand-red)]"
                        : "mt-1 text-[1.75rem] font-semibold leading-tight tabular-nums text-[var(--text-primary)]"
                    }
                  >
                    {departureTime}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                    <ClockIcon className="h-4 w-4 shrink-0" />
                    {departureDay}
                  </p>
                  <input
                    id="publish-departure"
                    type="datetime-local"
                    value={toLimaInputValue(departure)}
                    min={toLimaInputValue(new Date())}
                    aria-invalid={Boolean(departureError)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => {
                      const value = fromLimaInputValue(event.target.value);
                      if (value) {
                        edit();
                        setDeparture(value);
                      }
                    }}
                  />
                </div>
              </div>
              {departureError ? (
                <p className="publish-field-error" role="alert">
                  <AlertIcon className="h-4 w-4 shrink-0" />
                  {departureError}
                </p>
              ) : null}
            </div>

            <div className="publish-block">
              <p className="publish-label">Precio por plaza</p>
              <div className="mt-2 flex items-center justify-between gap-1">
                <button
                  type="button"
                  className="publish-stepper-button"
                  aria-label="Bajar el precio"
                  disabled={pricePerSeat <= MIN_PRICE}
                  onClick={() => {
                    edit();
                    setPricePerSeat(pricePerSeat - 1);
                  }}
                >
                  −
                </button>
                <p className="flex items-center gap-1.5">
                  <GoldCoinIcon className="h-5 w-5 shrink-0" />
                  <span className="text-[1.75rem] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
                    {pricePerSeat}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {pricePerSeat === 1 ? "crédito" : "créditos"}
                  </span>
                </p>
                <button
                  type="button"
                  className="publish-stepper-button"
                  aria-label="Subir el precio"
                  disabled={pricePerSeat >= MAX_PRICE}
                  onClick={() => {
                    edit();
                    setPricePerSeat(pricePerSeat + 1);
                  }}
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                De {MIN_PRICE} a {MAX_PRICE} créditos por plaza
              </p>
            </div>
          </div>

          {soatError ? (
            <div className="publish-alert mt-3" role="alert">
              <WarningIcon className="h-5 w-5 shrink-0 text-[var(--brand-red)]" />
              <span className="flex-1">{soatError}</span>
              <Link
                to={VEHICLE_PATH}
                state={{ returnTo: PUBLISH_PATH }}
                className="shrink-0 text-sm font-semibold text-[var(--brand-red)]"
                onClick={saveDraft}
              >
                Actualizar SOAT
              </Link>
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="publish-label">Plazas disponibles</p>
            <p className="text-base font-semibold text-[var(--brand-red)]">
              {seats} de {vehicle.seats}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2.5">
            {Array.from({ length: vehicle.seats }, (_, index) => index + 1).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={seats === option}
                  aria-label={`${option} ${option === 1 ? "plaza" : "plazas"}`}
                  className={
                    seats === option
                      ? "publish-seat-option publish-seat-option-active"
                      : "publish-seat-option"
                  }
                  onClick={() => {
                    edit();
                    setSelectedSeats(option);
                  }}
                >
                  <SeatIcon className="h-5 w-5" />
                  {option}
                </button>
              ),
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="publish-label">Ruta</p>
            <p className="text-sm text-[var(--text-muted)]">
              {stops.length} de {MAX_STOPS} paradas
            </p>
          </div>
          <ol className="publish-route-list">
            {isToCampus ? homeItem(true) : campusItem(true)}
            {stopItems}
            {isToCampus ? campusItem(false) : homeItem(false)}
          </ol>
          {routeError ? (
            <p className="publish-field-error" role="alert">
              <AlertIcon className="h-4 w-4 shrink-0" />
              {routeError}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Paradas referenciales definidas por ti
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="publish-condition" className="publish-label">
              Condiciones (opcional)
            </label>
            <p className="text-sm text-[var(--text-muted)]">
              {conditions.length} de {MAX_CONDITIONS}
            </p>
          </div>
          {conditions.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <li key={`${condition}-${index}`} className="publish-condition-chip">
                  <span className="min-w-0 break-words">{condition}</span>
                  <button
                    type="button"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    aria-label={`Quitar la condición «${condition}»`}
                    onClick={() => {
                      edit();
                      setConditionError("");
                      setConditions(conditions.filter((_, item) => item !== index));
                    }}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex gap-2">
            <input
              id="publish-condition"
              type="text"
              value={conditionDraft}
              placeholder="Agregar condición"
              disabled={conditions.length >= MAX_CONDITIONS}
              className="publish-input"
              onChange={(event) => {
                setConditionError("");
                setConditionDraft(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCondition();
                }
              }}
            />
            <button
              type="button"
              className="publish-add-button"
              disabled={!conditionDraft.trim() || conditions.length >= MAX_CONDITIONS}
              onClick={addCondition}
            >
              Agregar
            </button>
          </div>
          {conditionError || conditions.length >= MAX_CONDITIONS ? (
            <p className="publish-field-error" role="alert">
              <AlertIcon className="h-4 w-4 shrink-0" />
              {conditionError || MESSAGES.maxConditions}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <div className="auth-message auth-message-error mb-0" role="alert">
            {submitError}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="publish-submit"
            disabled={Boolean(departureError || soatError)}
            onClick={handleSubmit}
          >
            Revisar y publicar
          </button>
          <button
            type="button"
            className="w-full py-2 text-center text-base text-[var(--text-muted)]"
            onClick={handleExit}
          >
            Descartar
          </button>
        </div>
      </section>

      {isConfirming ? (
        <PublishRideConfirmModal
          directionLabel={directionLabel}
          departureLabel={`${departureDay} · ${departureTime}`}
          route={routeNames}
          seats={seats}
          pricePerSeat={pricePerSeat}
          conditions={conditions}
          isPublishing={publishMutation.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setIsConfirming(false)}
        />
      ) : null}

      {isDiscarding ? (
        <DiscardRideSheet
          onConfirm={leave}
          onCancel={() => setIsDiscarding(false)}
        />
      ) : null}
    </div>
  );
}
