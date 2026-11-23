import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/authService";
import { useNavBadges } from "@/features/dashboard/hooks/useNavBadges";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import {
  ModeChangeSheet,
  type ModeChangeStep,
} from "@/features/profile/components/ModeChangeSheet";
import { profileService } from "@/features/profile/services/profileService";
import { ASSISTANCE_LABELS } from "@/features/profile/utils/assistance";
import type { MobilityAssistance, Role } from "@/features/profile/types";
import {
  formatSoatDate,
  formatSoatDayMonth,
  getSoatState,
  soatChipLabel,
  type SoatState,
} from "@/features/profile/utils/soat";
import { walletService } from "@/features/wallet/services/walletService";
import type { Wallet } from "@/features/wallet/types";
import { ApiError } from "@/shared/api/apiClient";
import { GoldCoinIcon } from "@/shared/icons";
import { formatLimaTime, getLimaDayLabel } from "@/shared/utils/limaTime";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import AlertIcon from "@/assets/images/icons/alert-circle.svg?react";
import BuildingIcon from "@/assets/images/icons/building.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import ChevronRightIcon from "@/assets/images/icons/chevron-right.svg?react";
import HistoryIcon from "@/assets/images/icons/history.svg?react";
import HomeIcon from "@/assets/images/icons/home.svg?react";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LeafIcon from "@/assets/images/icons/leaf.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import LogoutIcon from "@/assets/images/icons/logout.svg?react";
import MailIcon from "@/assets/images/icons/mail.svg?react";
import MapPinIcon from "@/assets/images/icons/map-pin.svg?react";
import PaletteIcon from "@/assets/images/icons/palette.svg?react";
import PencilIcon from "@/assets/images/icons/pencil.svg?react";
import PlusIcon from "@/assets/images/icons/plus.svg?react";
import SeatsIcon from "@/assets/images/icons/passengers.svg?react";
import ShieldCheckIcon from "@/assets/images/icons/shield-check.svg?react";
import StarIcon from "@/assets/images/icons/star.svg?react";
import TuneIcon from "@/assets/images/icons/tune.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

const STATUS_LABELS = {
  ACTIVE: "Activa",
  PROFILE_PENDING: "Perfil pendiente",
  BLOCKED: "Bloqueada",
};

const SAVED_MESSAGES: Record<string, string> = {
  profile: "Tus datos se actualizaron.",
  vehicle: "Tu vehículo se guardó.",
};

const MODES: Array<{ value: Role; label: string }> = [
  { value: "PASSENGER", label: "Pasajero" },
  { value: "DRIVER", label: "Conductor" },
];

// Textos neutros: el perfil no guarda el género (ajuste 4 de P13).
const MODE_HELP = {
  DRIVER:
    "Como conductor publicas viajes y cobras créditos por cada plaza. Al cambiar de modo te pediremos confirmar.",
  PASSENGER: "Como pasajero reservas plazas en viajes de la comunidad UTP.",
  PASSENGER_WITH_VEHICLE: "Al cambiar de modo te pediremos confirmar.",
  PASSENGER_WITHOUT_VEHICLE: "Para usar el modo conductor necesitas registrar un vehículo.",
};

const SOAT_BANNER_ID = "profile-soat-banner";
const decimal = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

/** «Carlos M.»: primer nombre e inicial del apellido, como en el diseño. */
const shortName = (firstName: string, lastName: string) =>
  `${firstName.trim().split(/\s+/)[0]} ${Array.from(lastName.trim())[0] ?? ""}.`;

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="profile-stat">
      {icon}
      <p className="text-xl font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
        {value}
      </p>
      <p className="whitespace-nowrap text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

/** Franja de RF-14 sobre la tarjeta de perfil (14-B), o su variante roja si el SOAT ya venció. */
function SoatBanner({ state, endDate }: { state: SoatState; endDate: string }) {
  const expired = state.kind === "expired";
  return (
    <div
      id={SOAT_BANNER_ID}
      className={expired ? "profile-banner bg-[var(--brand-soft)] text-[var(--brand-red)]" : "profile-banner bg-[#fff4d6] text-[#8a5a00]"}
      role="status"
    >
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1">
        {expired
          ? `Tu SOAT venció el ${formatSoatDayMonth(endDate)}. Actualízalo para publicar viajes.`
          : `Tu SOAT vence el ${formatSoatDayMonth(endDate)}. Actualízalo para seguir publicando viajes.`}
      </p>
      <Link to="/perfil/vehiculo" className="shrink-0 font-semibold">
        Actualizar
      </Link>
    </div>
  );
}

/** Tarjeta «BILLETERA»: toda la tarjeta lleva a P21 (ajuste 1 de la decisión). */
function heldDetail(wallet: Wallet) {
  const credits = `${wallet.held} ${wallet.held === 1 ? "crédito retenido" : "créditos retenidos"}`;
  const booking = wallet.heldBooking;
  if (!booking) {
    return credits;
  }
  const departure = new Date(booking.departureTime);
  return `${credits} en tu reserva de ${getLimaDayLabel(departure)}, ${formatLimaTime(departure)}`;
}

/**
 * Con el rol conductor muestra lo retirable (P14); sin él, lo retenido en la reserva (13-A) o,
 * sin saldo, la invitación a recargar (13-B).
 */
function walletDetail(wallet: Wallet, hasDriverRole: boolean) {
  if (hasDriverRole) {
    return {
      locked: false,
      text: `${wallet.withdrawable} ${wallet.withdrawable === 1 ? "crédito retirable" : "créditos retirables"} a Yape`,
    };
  }
  if (wallet.held > 0) {
    return { locked: true, text: heldDetail(wallet) };
  }
  if (wallet.available === 0) {
    return { locked: false, text: "Recarga con Yape para reservar tu primer viaje." };
  }
  return null;
}

function WalletCard({ wallet, isDriver }: { wallet: Wallet | undefined; isDriver: boolean }) {
  const detail = wallet ? walletDetail(wallet, isDriver) : null;

  return (
    <Link to="/billetera" className="profile-card block transition active:scale-[0.995]">
      <p className="profile-card-label">Billetera</p>
      <div className="mt-2 flex items-center gap-3">
        <GoldCoinIcon className="h-8 w-8 shrink-0" />
        <p className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="text-[1.75rem] font-semibold leading-none tabular-nums text-[var(--text-primary)]">
            {wallet ? wallet.available : "—"}
          </span>
          <span className="text-sm text-[var(--text-brown)]">
            {wallet?.available === 1 ? "crédito disponible" : "créditos disponibles"}
          </span>
        </p>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
      </div>
      {detail ? (
        <p className="mt-2 flex items-start gap-1.5 text-[0.8125rem] tabular-nums text-[var(--text-muted)]">
          {detail.locked ? <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
          {detail.text}
        </p>
      ) : null}
    </Link>
  );
}

/**
 * Acceso al Historial (P19) desde el perfil: ya no está en el menú inferior. Avisa cuando hay
 * viajes por calificar (RF-10, 24 h).
 */
function HistoryLinkCard({ pendingRatings }: { pendingRatings: number }) {
  return (
    <Link to="/historial" className="profile-card block transition active:scale-[0.995]">
      <div className="flex items-center gap-3">
        <span className="profile-card-icon bg-[var(--surface-muted)] text-[var(--text-brown)]">
          <HistoryIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--text-primary)]">Historial de viajes</p>
          <p className="text-sm text-[var(--text-muted)]">
            {pendingRatings > 0
              ? `${pendingRatings} ${pendingRatings === 1 ? "calificación pendiente" : "calificaciones pendientes"}`
              : "Viajes terminados y calificaciones"}
          </p>
        </div>
        {pendingRatings > 0 ? (
          <span className="profile-chip bg-[var(--brand-soft)] text-[var(--brand-red)]">
            <StarIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Calificar
          </span>
        ) : null}
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
      </div>
    </Link>
  );
}

/**
 * «ASISTENCIA DE MOVILIDAD» (13-A): solo se ve en el perfil propio (RN-22). Se edita en P15;
 * el enlace abre esa pantalla en la tarjeta de asistencia.
 */
function AssistanceCard({ assistance }: { assistance: MobilityAssistance | null }) {
  return (
    <section className="profile-card">
      <div className="flex items-center gap-2.5">
        <span className="profile-card-icon h-9 w-9 bg-[var(--surface-muted)] text-[var(--text-brown)]">
          <AccessibleIcon className="h-5 w-5" />
        </span>
        <p className="profile-card-label min-w-0 flex-1 whitespace-nowrap text-[0.6875rem] tracking-normal">
          Asistencia de movilidad
        </p>
        <span
          className={`profile-chip px-2.5 ${assistance ? "bg-[#e6f4ea] text-[#1b7f3b]" : "bg-[var(--surface-muted)] text-[var(--text-brown)]"}`}
        >
          {assistance ? ASSISTANCE_LABELS[assistance.type] : "No declarada"}
        </span>
      </div>
      {assistance?.note ? (
        <p className="mt-3 text-[0.9375rem] text-[var(--text-primary)]">{assistance.note}</p>
      ) : null}
      <p className="mt-3 flex items-start gap-1.5 text-[0.8125rem] text-[var(--text-muted)]">
        <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Es opcional. Si la declaras, solo la verán los conductores de los viajes que reserves.
      </p>
      {assistance ? null : (
        <Link
          to="/perfil/datos#asistencia"
          className="mt-3 inline-block text-sm font-semibold text-[var(--brand-red)]"
        >
          Declarar en Actualizar datos
        </Link>
      )}
    </section>
  );
}

/**
 * «Mi perfil» (P14 conductor; P13 pasajero parte del mismo diseño). El selector de modo no
 * cambia hasta confirmar en la hoja inferior (RF-14, RN-48).
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [modeStep, setModeStep] = useState<ModeChangeStep | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);
  const [isChangingMode, setIsChangingMode] = useState(false);
  const saved = (location.state as { saved?: string } | null)?.saved;

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["users", "me"],
    queryFn: profileService.getMine,
  });
  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: walletService.getWallet });
  const { pendingRatings } = useNavBadges();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // La sesión ya se cerró en el cliente aunque la petición falle.
    }
    queryClient.clear();
    navigate("/auth/login", { replace: true });
  };

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-muted)]">
        Cargando tu perfil...
      </p>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-message dashboard-message-error" role="alert">
          No se pudo cargar tu perfil
          {error instanceof Error ? `: ${error.message}` : ""}
        </p>
        <button type="button" className="auth-button-primary" onClick={() => refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const { vehicle, stats, campus, homeAddress, rating } = profile;
  const isDriver = profile.activeMode === "DRIVER";
  const hasDriverRole = profile.roles.includes("DRIVER");
  const soat = vehicle?.soat ?? null;
  const soatState = soat ? getSoatState(soat) : null;
  const soatNeedsAction = soatState != null && soatState.kind !== "valid";

  const openModeChange = (target: Role) => {
    if (target === profile.activeMode) {
      return;
    }
    setModeError(null);
    if (profile.tripInProgress) {
      setModeStep({ kind: "trip-in-progress", trip: profile.tripInProgress });
    } else if (target === "DRIVER" && (!vehicle || vehicle.status !== "ACTIVE")) {
      setModeStep({ kind: "vehicle-required" });
    } else {
      setModeStep({ kind: "confirm", target });
    }
  };

  const confirmModeChange = async () => {
    if (modeStep?.kind !== "confirm") {
      return;
    }
    setIsChangingMode(true);
    setModeError(null);
    try {
      const updated = await profileService.changeMode(modeStep.target);
      queryClient.setQueryData(["users", "me"], updated);
      // El dashboard, Mis viajes y la billetera dependen del modo activo.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rides"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
      ]);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Otro dispositivo pudo iniciar un viaje: se recarga el perfil y se explica con 14-D.
      if (err instanceof ApiError && err.code === "TRIP_IN_PROGRESS") {
        const { data: fresh } = await refetch();
        if (fresh?.tripInProgress) {
          setModeStep({ kind: "trip-in-progress", trip: fresh.tripInProgress });
          return;
        }
      }
      if (err instanceof ApiError && err.code === "VEHICLE_REQUIRED") {
        setModeStep({ kind: "vehicle-required" });
        return;
      }
      setModeError(err instanceof Error ? err.message : "No se pudo cambiar de modo");
    } finally {
      setIsChangingMode(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Configuración
        </p>
        <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--text-primary)]">
          Mi perfil
        </h1>
      </div>

      {isDriver && soat && soatNeedsAction ? (
        <SoatBanner state={soatState} endDate={soat.endDate} />
      ) : null}

      {saved && SAVED_MESSAGES[saved] ? (
        <p className="dashboard-message" role="status">
          {SAVED_MESSAGES[saved]}
        </p>
      ) : null}

      <section className="profile-card">
        <div className="flex items-center gap-4">
          <DriverAvatar
            name={`${profile.firstName.split(" ")[0]} ${profile.lastName}`}
            photoUrl={profile.photoUrl}
            className="profile-avatar"
          />
          <div className="min-w-0">
            <p className="truncate text-[1.375rem] font-semibold leading-tight text-[var(--text-primary)]">
              {shortName(profile.firstName, profile.lastName)}
            </p>
            {rating ? (
              <p className="mt-0.5 text-sm tabular-nums text-[var(--text-muted)]">
                <span className="font-semibold text-[#b7791f]">
                  <span aria-hidden="true">★</span> {decimal.format(rating.average)}
                </span>{" "}
                ({rating.count} {rating.count === 1 ? "calificación" : "calificaciones"})
              </p>
            ) : (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--text-muted)]">
                <StarIcon className="h-4 w-4" aria-hidden="true" />
                Sin calificaciones aún
              </p>
            )}
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--text-brown)]">
              <MailIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{profile.email}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat
            icon={<CarIcon className="h-5 w-5 text-[var(--text-muted)]" />}
            value={String(stats.trips)}
            label="Viajes"
          />
          <Stat
            icon={<CheckCircleIcon className="h-5 w-5 text-[var(--text-muted)]" />}
            // RF-14: sin viajes completados el cumplimiento todavía no existe.
            value={stats.trips > 0 ? `${stats.compliance}%` : "—"}
            label="Cumplimiento"
          />
          <Stat
            icon={<LeafIcon className="h-5 w-5 text-[var(--text-muted)]" />}
            value={`${decimal.format(stats.co2SavedKg)} kg`}
            label="Ahorro CO₂"
          />
        </div>
        {stats.trips === 0 ? (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
            <InfoIcon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Tu cumplimiento aparecerá cuando completes tu primer viaje.
          </p>
        ) : null}

        <Link to="/perfil/datos" className="profile-action">
          <PencilIcon className="h-4 w-4" />
          Actualizar datos
        </Link>
      </section>

      <section className="profile-card" aria-labelledby="profile-mode-label">
        <p id="profile-mode-label" className="profile-card-label">
          Modo de uso
        </p>
        <div className="profile-mode-segment" role="radiogroup" aria-labelledby="profile-mode-label">
          {MODES.map((mode) => {
            const isActive = profile.activeMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={isActive ? "profile-mode-option profile-mode-option-active" : "profile-mode-option"}
                onClick={() => openModeChange(mode.value)}
              >
                {mode.value === "PASSENGER" ? (
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <CarIcon className="h-4 w-4" aria-hidden="true" />
                )}
                {mode.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[0.8125rem] text-[var(--text-muted)]">
          {isDriver
            ? MODE_HELP.DRIVER
            : `${MODE_HELP.PASSENGER} ${vehicle ? MODE_HELP.PASSENGER_WITH_VEHICLE : MODE_HELP.PASSENGER_WITHOUT_VEHICLE}`}
        </p>
      </section>

      <WalletCard wallet={wallet} isDriver={hasDriverRole} />

      <HistoryLinkCard pendingRatings={pendingRatings} />

      {!isDriver ? <AssistanceCard assistance={profile.mobilityAssistance} /> : null}

      {!vehicle ? (
        <section className="profile-card">
          <div className="flex items-center gap-3">
            <span className="profile-card-icon bg-[var(--brand-soft)] text-[var(--brand-red)]">
              <CarIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="profile-card-label">¿Tienes vehículo?</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">Comparte tus viajes</p>
            </div>
          </div>
          <p className="mt-3 text-[0.9375rem] text-[var(--text-brown)]">
            Registra tu vehículo y su SOAT para publicar viajes.
          </p>
          <Link to="/perfil/vehiculo" className="profile-action profile-action-soft">
            <PlusIcon className="h-4 w-4" />
            Registrar vehículo
          </Link>
        </section>
      ) : null}

      {vehicle ? (
        <section className="profile-card">
          <div className="flex items-center gap-3">
            <span className="profile-card-icon bg-[var(--brand-soft)] text-[var(--brand-red)]">
              <CarIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="profile-card-label">Vehículo registrado</p>
              <p className="truncate text-xl font-semibold text-[var(--text-primary)]">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
            <p
              className={`profile-chip ${vehicle.status === "ACTIVE" ? "bg-[#e6f4ea] text-[#1b7f3b]" : "bg-[var(--surface-muted)] text-[var(--text-brown)]"}`}
            >
              {vehicle.status === "ACTIVE" ? "Activo" : "Inactivo"}
            </p>
          </div>

          <dl className="profile-data">
            <div className="profile-data-row">
              <dt>
                <PaletteIcon className="h-4 w-4" /> Color y año
              </dt>
              <dd>
                {vehicle.color} • {vehicle.year}
              </dd>
            </div>
            <div className="profile-data-row">
              <dt>
                <IdCardIcon className="h-4 w-4" /> Placa
              </dt>
              <dd className="text-[var(--brand-red)]">{vehicle.plate}</dd>
            </div>
            <div className="profile-data-row">
              <dt>
                <SeatsIcon className="h-4 w-4" /> Asientos para pasajeros
              </dt>
              <dd className="tabular-nums">{vehicle.seats}</dd>
            </div>
            <div className="profile-data-row">
              <dt>
                <ShieldCheckIcon className="h-4 w-4" /> SOAT
              </dt>
              <dd className="text-right tabular-nums">
                {vehicle.soat ? (
                  // Si no cabe, se parte entre la aseguradora y la fecha, no dentro de la fecha.
                  <>
                    {vehicle.soat.insurer} ·{" "}
                    <span className="whitespace-nowrap">
                      vence {formatSoatDate(vehicle.soat.endDate)}
                    </span>
                  </>
                ) : (
                  "No declarado"
                )}
              </dd>
            </div>
          </dl>

          {vehicle.accessibility?.wheelchair || soatState ? (
            <div className="mt-3 flex flex-wrap gap-1.5 [&>span]:px-2.5">
              {vehicle.accessibility?.wheelchair ? (
                <span className="profile-chip bg-[#e6f4ea] text-[#1b7f3b]">
                  <AccessibleIcon className="h-4 w-4" aria-hidden="true" />
                  Apto para silla de ruedas
                </span>
              ) : null}
              {soatState ? (
                <span
                  className={`profile-chip ${
                    soatState.kind === "valid"
                      ? "bg-[var(--surface-muted)] text-[var(--text-brown)]"
                      : soatState.kind === "expiring"
                        ? "bg-[#fff4d6] text-[#8a5a00]"
                        : "bg-[var(--brand-soft)] text-[var(--brand-red)]"
                  }`}
                >
                  {soatChipLabel(soatState)}
                </span>
              ) : null}
            </div>
          ) : null}

          {vehicle.soat ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
              <InfoIcon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              SOAT declarado por ti; ColaboraCar no lo verifica con la aseguradora.
            </p>
          ) : null}

          <Link
            to="/perfil/vehiculo"
            className={soatNeedsAction ? "profile-action profile-action-primary" : "profile-action"}
            aria-describedby={isDriver && soatNeedsAction ? SOAT_BANNER_ID : undefined}
          >
            <TuneIcon className="h-4 w-4" />
            Actualizar vehículo
          </Link>
        </section>
      ) : null}

      <section className="profile-card">
        <div className="flex items-center gap-3">
          <span className="profile-card-icon bg-[var(--brand-soft)] text-[var(--brand-red)]">
            <BuildingIcon className="h-6 w-6" />
          </span>
          <p className="profile-card-label">Sede universitaria</p>
        </div>
        {campus ? (
          <>
            <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{campus.name}</p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-[var(--text-brown)]">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {campus.address}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Aún no tienes una sede registrada.
          </p>
        )}
      </section>

      <section className="profile-card">
        <div className="flex items-center gap-3">
          <span className="profile-card-icon bg-[var(--surface-muted)] text-[var(--text-brown)]">
            <HomeIcon className="h-6 w-6" />
          </span>
          <p className="profile-card-label">Dirección de residencia</p>
        </div>
        {homeAddress ? (
          <>
            <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
              {homeAddress.label}
            </p>
            {homeAddress.address ? (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-[var(--text-brown)]">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {homeAddress.address}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Aún no tienes una dirección de residencia registrada.
          </p>
        )}
      </section>

      <section className="profile-card">
        <div className="flex items-center justify-between gap-3">
          <p className="profile-card-label">Estado de cuenta</p>
          <p
            className={`profile-chip ${profile.status === "ACTIVE" ? "bg-[#e6f4ea] text-[#1b7f3b]" : "bg-[var(--surface-muted)] text-[var(--text-brown)]"}`}
          >
            {STATUS_LABELS[profile.status]}
          </p>
        </div>
        <div className="mt-3 flex items-start gap-3">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#1b7f3b]" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              Correo institucional verificado
            </p>
            <p className="text-sm text-[var(--text-muted)]">@utp.edu.pe</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="profile-logout"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogoutIcon className="h-5 w-5" />
        {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>

      {modeStep ? (
        <ModeChangeSheet
          step={modeStep}
          isBusy={isChangingMode}
          error={modeError}
          onConfirm={confirmModeChange}
          onClose={() => {
            setModeStep(null);
            setModeError(null);
          }}
        />
      ) : null}
    </div>
  );
}
