import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
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
  MAX_PRICE,
  MAX_STOPS,
  MIN_PRICE,
  buildDeparture,
  createRoutePoint,
  findStopPosition,
  formatTime12h,
  isDepartureInRange,
  measureRoute,
} from "@/features/rides/utils/route";
import { ApiError } from "@/shared/api/apiClient";
import CapIcon from "@/assets/images/icons/graduation-cap.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import CashIcon from "@/assets/images/icons/cash.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import CloseIcon from "@/assets/images/icons/close.svg?react";
import HomeIcon from "@/assets/images/icons/home.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import PencilIcon from "@/assets/images/icons/pencil.svg?react";
import SeatIcon from "@/assets/images/icons/passenger.svg?react";
import TapIcon from "@/assets/images/icons/tap.svg?react";
import TargetIcon from "@/assets/images/icons/target.svg?react";
import TrashIcon from "@/assets/images/icons/trash.svg?react";

const DIRECTIONS: Array<{ value: RideDirection; label: string; icon: ReactNode }> = [
  {
    value: "TO_CAMPUS",
    label: "Ida a la universidad",
    icon: <CapIcon className="h-5 w-5" />,
  },
  {
    value: "TO_HOME",
    label: "Regreso a casa",
    icon: <HomeIcon className="h-5 w-5" />,
  },
];

const DEFAULT_TIME = "07:30";
const DEFAULT_PRICE = 5;
const MAX_LABEL_LENGTH = 80;
const MAX_CONDITIONS = 10;
const MAX_CONDITION_LENGTH = 120;

const isNotFound = (error: unknown) =>
  error instanceof ApiError && error.status === 404;

export function PublishRidePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [direction, setDirection] = useState<RideDirection>("TO_CAMPUS");
  const [time, setTime] = useState(DEFAULT_TIME);
  const [pricePerSeat, setPricePerSeat] = useState(DEFAULT_PRICE);
  // `null`: todavía no se eligió; se ofrecen todas las plazas del vehículo.
  const [selectedSeats, setSelectedSeats] = useState<number | null>(null);
  // La casa es el extremo de la ruta que marca el conductor; el otro es la sede.
  const [home, setHome] = useState<RoutePoint | null>(null);
  // Paradas en orden de la casa a la sede.
  const [stops, setStops] = useState<RoutePoint[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionDraft, setConditionDraft] = useState("");
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [fitKey, setFitKey] = useState(0);

  // Solo los usuarios con vehículo pueden publicar (RF-18).
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
  const seats = Math.min(selectedSeats ?? vehicle?.seats ?? 1, vehicle?.seats ?? 1);

  // Si el perfil ya tiene la dirección de residencia, se usa como punto de partida.
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
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "No se pudo publicar el viaje",
      );
    },
  });

  const header = (
    <header className="publish-header">
      <Link to="/dashboard" className="publish-header-button" aria-label="Cerrar">
        <CloseIcon className="h-6 w-6" />
      </Link>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        Publicar Viaje
      </h1>
      <DriverAvatar
        name={
          profile ? `${profile.firstName.split(" ")[0]} ${profile.lastName}` : ""
        }
        photoUrl={profile?.photoUrl}
        className="dashboard-profile-avatar ml-auto"
      />
    </header>
  );

  const renderNotice = (title: string, message: string, action?: ReactNode) => (
    <div className="publish-screen">
      {header}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-[var(--webview-px)] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-red)]">
          <CarIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 text-[0.9375rem] text-[var(--text-brown)]">{message}</p>
        {action}
        <Link to="/dashboard" className="auth-button-secondary">
          Volver a los viajes
        </Link>
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
    return renderNotice(
      "Registra un vehículo",
      "Para publicar viajes necesitas tener un vehículo registrado en tu cuenta.",
      <Link to="/perfil/vehiculo" className="auth-button-primary mt-6">
        Registrar vehículo
      </Link>,
    );
  }

  const loadError =
    vehicleQuery.error ?? profileQuery.error ?? campusQuery.error;
  if (loadError || !vehicle || !profile) {
    return renderNotice(
      "No se pudieron cargar tus datos",
      loadError instanceof Error ? loadError.message : "Inténtalo nuevamente.",
      <button
        type="button"
        className="auth-button-primary mt-6"
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

  if (!campus?.location) {
    return renderNotice(
      "No encontramos la ubicación de tu sede",
      "La sede es un extremo de la ruta y la API no devolvió sus coordenadas.",
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
  const departure = buildDeparture(time);
  const directionLabel = DIRECTIONS.find((item) => item.value === direction)!.label;

  const handleMapTap = (location: GeoPoint) => {
    setError("");
    if (!home) {
      setHome(createRoutePoint("", location));
      return;
    }
    if (stops.length >= MAX_STOPS) {
      setError(`Puedes agregar como máximo ${MAX_STOPS} paradas`);
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
    setError("");
    if (home?.id === pointId) {
      setHome({ ...home, ...changes });
      return;
    }
    setStops((current) =>
      current.map((stop) => (stop.id === pointId ? { ...stop, ...changes } : stop)),
    );
  };

  const removePoint = (pointId: string) => {
    if (home?.id !== pointId) {
      setStops((current) => current.filter((stop) => stop.id !== pointId));
      return;
    }
    // Sin la casa, la parada más alejada de la sede pasa a ser el extremo de la ruta.
    setHome(stops[0] ?? null);
    setStops(stops.slice(1));
  };

  const addCondition = () => {
    const condition = conditionDraft.trim();
    if (!condition || conditions.length >= MAX_CONDITIONS) {
      return;
    }
    setConditions([...conditions, condition]);
    setConditionDraft("");
  };

  const handleDiscard = () => {
    setDirection("TO_CAMPUS");
    setTime(DEFAULT_TIME);
    setPricePerSeat(DEFAULT_PRICE);
    setSelectedSeats(null);
    setHome(null);
    setStops([]);
    setConditions([]);
    setConditionDraft("");
    setError("");
    setFitKey((key) => key + 1);
  };

  const validate = () => {
    if (!home) {
      return isToCampus
        ? "Toca el mapa para marcar tu punto de partida"
        : "Toca el mapa para marcar tu destino";
    }
    if ([home, ...stops].some((point) => !point.label.trim())) {
      return "Escribe el nombre de cada punto de la ruta";
    }
    if (!isDepartureInRange(time)) {
      return "La hora de salida debe estar entre las 6:00 y las 23:00";
    }
    return "";
  };

  const handleSubmit = () => {
    const validationError = validate();
    setError(validationError);
    if (!validationError) {
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
      departureTime: departure.date.toISOString(),
      origin: isToCampus ? homePlace : campusPlace,
      destination: isToCampus ? campusPlace : homePlace,
      stops: orderedStops.map(toPlace),
      pricePerSeat,
      seats,
      conditions,
    });
  };

  const campusRow = (
    <li key="campus" className="publish-route-row">
      <span className="publish-route-badge bg-[var(--accent-red)] text-white">
        <CapIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-[var(--text-primary)]">
        {campus.name}
      </span>
      <span className="text-xs text-[var(--text-muted)]">
        {isToCampus ? "Destino" : "Origen"}
      </span>
    </li>
  );

  const renderPointRow = (point: RoutePoint, isHome: boolean, index: number) => (
    <li key={point.id} className="publish-route-row">
      <span
        className={
          isHome
            ? "publish-route-badge bg-[#0b6e8e] text-white"
            : "publish-route-badge border-2 border-[var(--brand-red)] text-[var(--brand-red)]"
        }
      >
        {isHome ? (isToCampus ? "A" : "B") : index + 1}
      </span>
      <input
        type="text"
        value={point.label}
        maxLength={MAX_LABEL_LENGTH}
        placeholder={
          isHome
            ? isToCampus
              ? "Nombre del punto de partida"
              : "Nombre del destino"
            : "Nombre de la parada"
        }
        aria-label={isHome ? "Nombre del punto" : `Nombre de la parada ${index + 1}`}
        className="input-base flex-1 text-[0.9375rem]"
        onChange={(event) => updatePoint(point.id, { label: event.target.value })}
      />
      <button
        type="button"
        className="publish-icon-button"
        aria-label="Quitar punto"
        onClick={() => removePoint(point.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );

  const homeRow = home ? renderPointRow(home, true, 0) : null;
  const stopRows = orderedStops.map((stop, index) => renderPointRow(stop, false, index));

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
          <p className="publish-map-chip right-3 top-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-red)]" />
            <span className="font-semibold text-[var(--text-primary)]">
              {distanceKm.toFixed(1)} km
            </span>
            <span className="text-[var(--text-muted)]">• ~{durationMin} min</span>
          </p>
        ) : null}

        <p className="publish-map-chip bottom-7 left-3 max-w-[70%] rounded-xl">
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

      <section className="publish-sheet">
        <span className="publish-sheet-handle" aria-hidden="true" />

        <div className="publish-segment" role="radiogroup" aria-label="Sentido del viaje">
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
              onClick={() => setDirection(item.value)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="publish-card">
          <div className="flex items-center justify-between gap-3">
            <p className="publish-card-label">Ruta</p>
            <p className="text-xs text-[var(--text-muted)]">
              {stops.length} de {MAX_STOPS} paradas
            </p>
          </div>
          <ul className="mt-2 space-y-2">
            {isToCampus ? homeRow : campusRow}
            {stopRows}
            {isToCampus ? campusRow : homeRow}
          </ul>
          {!home ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {isToCampus
                ? "Toca el mapa para marcar de dónde sales."
                : "Toca el mapa para marcar a dónde vas."}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="publish-card">
            <div className="flex items-center justify-between">
              <label htmlFor="publish-time" className="publish-card-label">
                Salida
              </label>
              <ClockIcon className="h-5 w-5 text-[var(--brand-red)]" />
            </div>
            <div className="relative mt-2 flex items-center justify-between gap-2">
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {formatTime12h(time)}
              </p>
              <span className="publish-icon-button">
                <PencilIcon className="h-4 w-4" />
              </span>
              {/* El selector nativo cubre toda la fila: tocarla abre el reloj. */}
              <input
                id="publish-time"
                type="time"
                value={time}
                min="06:00"
                max="23:00"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(event) => {
                  setError("");
                  setTime(event.target.value || DEFAULT_TIME);
                }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Sale {departure.day}</p>
          </div>

          <div className="publish-card">
            <div className="flex items-center justify-between">
              <p className="publish-card-label">Precio / plaza</p>
              <CashIcon className="h-5 w-5 text-[#0b6e8e]" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-1">
              <p className="text-xl font-bold text-[var(--text-primary)]">
                <span className="text-base font-normal text-[var(--text-muted)]">S/</span>{" "}
                {pricePerSeat.toFixed(2)}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="publish-icon-button text-lg font-bold"
                  aria-label="Bajar el precio"
                  disabled={pricePerSeat <= MIN_PRICE}
                  onClick={() => setPricePerSeat(pricePerSeat - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="publish-icon-button text-lg font-bold"
                  aria-label="Subir el precio"
                  disabled={pricePerSeat >= MAX_PRICE}
                  onClick={() => setPricePerSeat(pricePerSeat + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {pricePerSeat} {pricePerSeat === 1 ? "crédito" : "créditos"}
            </p>
          </div>
        </div>

        <div className="publish-card">
          <div className="flex items-center justify-between gap-3">
            <p className="publish-card-label">Plazas disponibles</p>
            <p className="text-sm font-semibold text-[var(--brand-red)]">
              {seats} {seats === 1 ? "asiento libre" : "asientos libres"}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: vehicle.seats }, (_, index) => index + 1).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={seats === option}
                  className={
                    seats === option
                      ? "publish-seat-option publish-seat-option-active"
                      : "publish-seat-option"
                  }
                  onClick={() => setSelectedSeats(option)}
                >
                  <SeatIcon className="h-5 w-5" />
                  {option}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="publish-card">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="publish-condition" className="publish-card-label">
              Condiciones del viaje
            </label>
            <p className="text-xs text-[var(--text-muted)]">Opcional</p>
          </div>
          {conditions.length ? (
            <ul className="mt-2 space-y-1.5">
              {conditions.map((condition, index) => (
                <li key={`${condition}-${index}`} className="publish-route-row">
                  <span className="min-w-0 flex-1 text-[0.9375rem] text-[var(--text-primary)]">
                    {condition}
                  </span>
                  <button
                    type="button"
                    className="publish-icon-button"
                    aria-label="Quitar condición"
                    onClick={() =>
                      setConditions(conditions.filter((_, item) => item !== index))
                    }
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {conditions.length < MAX_CONDITIONS ? (
            <div className="publish-route-row mt-2">
              <input
                id="publish-condition"
                type="text"
                value={conditionDraft}
                maxLength={MAX_CONDITION_LENGTH}
                placeholder="Ej. Máximo de espera 5 minutos"
                className="input-base flex-1 text-[0.9375rem]"
                onChange={(event) => setConditionDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCondition();
                  }
                }}
              />
              <button
                type="button"
                className="text-sm font-semibold text-[var(--brand-red)] disabled:opacity-40"
                disabled={!conditionDraft.trim()}
                onClick={addCondition}
              >
                Agregar
              </button>
            </div>
          ) : null}
        </div>

        <p className="publish-card flex items-start gap-3 text-sm text-[var(--text-muted)]">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#0b6e8e]" />
          <span>
            El precio por plaza va de{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              S/ {MIN_PRICE.toFixed(2)} a S/ {MAX_PRICE.toFixed(2)}
            </span>{" "}
            (1 sol = 1 crédito). La salida debe estar entre las 6:00 y las 23:00.
          </span>
        </p>

        {error ? (
          <div className="auth-message auth-message-error mb-0" role="alert">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          className="auth-button-primary mt-0 gap-2"
          onClick={handleSubmit}
        >
          <CarIcon className="h-6 w-6" />
          Publicar Viaje Universitario
        </button>

        <button
          type="button"
          className="w-full py-1 text-center text-[0.9375rem] text-[var(--text-muted)]"
          onClick={handleDiscard}
        >
          Descartar configuración
        </button>
      </section>

      {isConfirming ? (
        <PublishRideConfirmModal
          directionLabel={directionLabel}
          departureLabel={`${formatTime12h(time)}, ${departure.day}`}
          seats={seats}
          pricePerSeat={pricePerSeat}
          isPublishing={publishMutation.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setIsConfirming(false)}
        />
      ) : null}
    </div>
  );
}
