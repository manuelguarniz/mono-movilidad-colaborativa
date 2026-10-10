import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/authService";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { profileService } from "@/features/profile/services/profileService";
import BuildingIcon from "@/assets/images/icons/building.svg?react";
import CapIcon from "@/assets/images/icons/graduation-cap.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import HomeIcon from "@/assets/images/icons/home.svg?react";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";
import LeafIcon from "@/assets/images/icons/leaf.svg?react";
import LogoutIcon from "@/assets/images/icons/logout.svg?react";
import MailIcon from "@/assets/images/icons/mail.svg?react";
import MapPinIcon from "@/assets/images/icons/map-pin.svg?react";
import PaletteIcon from "@/assets/images/icons/palette.svg?react";
import PencilIcon from "@/assets/images/icons/pencil.svg?react";
import SeatsIcon from "@/assets/images/icons/passengers.svg?react";
import ShieldCheckIcon from "@/assets/images/icons/shield-check.svg?react";
import ThumbUpIcon from "@/assets/images/icons/thumb-up.svg?react";
import TuneIcon from "@/assets/images/icons/tune.svg?react";

const STATUS_LABELS = {
  ACTIVE: "Activa",
  PROFILE_PENDING: "Perfil pendiente",
  BLOCKED: "Bloqueada",
};

const SAVED_MESSAGES: Record<string, string> = {
  profile: "Tus datos se actualizaron.",
  vehicle: "Tu vehículo se guardó.",
};

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="profile-stat">
      {icon}
      <p className="text-xl font-bold leading-tight text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

/** «Mi Perfil» (frames 13 y 14): la modalidad activa decide si se muestra como pasajero o conductor. */
export function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const saved = (location.state as { saved?: string } | null)?.saved;

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["users", "me"],
    queryFn: profileService.getMine,
  });

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
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="dashboard-page">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Configuración
          </p>
          <h1 className="text-[1.75rem] font-bold leading-tight text-[var(--text-primary)]">
            Mi Perfil
          </h1>
        </div>
        <p className="profile-chip bg-[var(--surface-muted)] text-[#0b6e8e]">
          <ShieldCheckIcon className="h-4 w-4" />
          {STATUS_LABELS[profile.status]}
        </p>
      </div>

      {saved && SAVED_MESSAGES[saved] ? (
        <p className="dashboard-message" role="status">
          {SAVED_MESSAGES[saved]}
        </p>
      ) : null}

      <section className="profile-card">
        <div className="flex items-center gap-3">
          <DriverAvatar
            name={`${profile.firstName.split(" ")[0]} ${profile.lastName}`}
            photoUrl={profile.photoUrl}
            className="driver-avatar h-16 w-16 text-lg"
          />
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-[var(--text-primary)]">
              {fullName}
            </p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-red)]">
              {isDriver ? <CarIcon className="h-4 w-4" /> : <CapIcon className="h-4 w-4" />}
              {isDriver ? "Conductor universitario" : "Pasajero universitario"}
              {rating ? (
                <span className="text-[var(--text-primary)]">
                  · <span className="text-amber-500">★</span> {rating.average}
                </span>
              ) : null}
            </p>
            <p className="flex items-center gap-1.5 truncate text-sm text-[var(--text-muted)]">
              <MailIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat
            icon={<CarIcon className="h-5 w-5 text-[var(--brand-red)]" />}
            value={String(stats.trips)}
            label="Viajes"
          />
          <Stat
            icon={<ThumbUpIcon className="h-5 w-5 text-[#0b6e8e]" />}
            value={`${stats.compliance}%`}
            // El mismo dato se llama «Puntualidad» en el perfil del conductor (RF-19).
            label={isDriver ? "Puntualidad" : "Cumplimiento"}
          />
          <Stat
            icon={<LeafIcon className="h-5 w-5 text-[var(--text-muted)]" />}
            value={`${stats.co2SavedKg}kg`}
            label="Ahorro CO₂"
          />
        </div>

        <Link to="/perfil/datos" className="profile-action">
          <PencilIcon className="h-4 w-4" />
          Actualizar datos
        </Link>
      </section>

      {isDriver && vehicle ? (
        <section className="profile-card">
          <div className="flex items-center gap-3">
            <span className="profile-card-icon bg-[var(--brand-soft)] text-[var(--brand-red)]">
              <CarIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="profile-card-label">Vehículo registrado</p>
              <p className="truncate text-lg font-semibold text-[var(--text-primary)]">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
            <p className="profile-chip bg-[var(--surface-muted)] text-[var(--text-brown)]">
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
              <dd className="rounded bg-[var(--brand-soft)] px-1.5 text-[var(--brand-red)]">
                {vehicle.plate}
              </dd>
            </div>
            <div className="profile-data-row">
              <dt>
                <SeatsIcon className="h-4 w-4" /> Plazas compartidas
              </dt>
              <dd>
                {vehicle.seats} {vehicle.seats === 1 ? "asiento" : "asientos"}
              </dd>
            </div>
          </dl>

          <Link to="/perfil/vehiculo" className="profile-action">
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
            <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
              {campus.name}
            </p>
            <p className="text-sm text-[var(--text-brown)]">
              Universidad Tecnológica del Perú
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-[var(--text-muted)]">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-red)]" />
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
          <span className="profile-card-icon bg-[#d7ecf6] text-[#0b6e8e]">
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
              <p className="mt-1 flex items-start gap-1.5 text-sm text-[var(--text-muted)]">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6e8e]" />
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
          <p className="text-sm font-semibold text-[#0b6e8e]">
            {STATUS_LABELS[profile.status]}
          </p>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#f3f3f3] px-3 py-3">
          <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#0b6e8e]" />
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Correo institucional</p>
            <p className="text-sm text-[var(--text-brown)]">
              Cuenta registrada con el dominio oficial @utp.edu.pe.
            </p>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <IdCardIcon
            className={`h-5 w-5 ${profile.documentNumber ? "text-[#0b6e8e]" : "text-[var(--text-muted)]"}`}
          />
          {profile.documentNumber
            ? `Documento de identidad registrado (${profile.documentType})`
            : "Documento de identidad pendiente: regístralo en «Actualizar datos»"}
        </p>
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
    </div>
  );
}
