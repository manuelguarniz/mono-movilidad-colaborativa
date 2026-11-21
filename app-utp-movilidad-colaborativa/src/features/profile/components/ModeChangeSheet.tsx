import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import type { Role, TripInProgress } from "@/features/profile/types";
import { formatLimaTime } from "@/shared/utils/limaTime";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

const TITLE_ID = "mode-change-title";

/** Qué hoja se abre al tocar el modo no activo del selector (RF-14, RN-48). */
export type ModeChangeStep =
  | { kind: "confirm"; target: Role }
  | { kind: "vehicle-required" }
  | { kind: "trip-in-progress"; trip: TripInProgress };

type ModeChangeSheetProps = {
  step: ModeChangeStep;
  isBusy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

const COPY: Record<Role, { title: string; body: string; note?: string }> = {
  PASSENGER: {
    title: "¿Cambiar a modo pasajero?",
    body: "Verás los viajes disponibles para reservar.",
    note: "Tus viajes publicados siguen activos. Los gestionas al volver a modo conductor.",
  },
  DRIVER: {
    title: "¿Cambiar a modo conductor?",
    body: "Verás tus viajes publicados y podrás publicar nuevos.",
  },
};

function SheetIcon({ tone, children }: { tone: "brand" | "amber"; children: ReactNode }) {
  return (
    <span
      className={`profile-sheet-icon ${tone === "amber" ? "bg-[#fff4d6] text-[#8a5a00]" : "bg-[var(--brand-soft)] text-[var(--brand-red)]"}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** 14-C (confirmar el cambio), 14-D (viaje en curso) y el caso sin vehículo de P13. */
export function ModeChangeSheet({ step, isBusy, error, onConfirm, onClose }: ModeChangeSheetProps) {
  if (step.kind === "trip-in-progress") {
    const { trip } = step;
    const startedAt = trip.startedAt ? new Date(trip.startedAt) : null;
    return (
      <ConfirmSheet
        titleId={TITLE_ID}
        isBusy={false}
        error={null}
        onClose={onClose}
        actions={
          <>
            <Link to="/mis-viajes" className="auth-button-primary">
              Ir a Mis viajes
            </Link>
            <button type="button" className="profile-sheet-secondary" onClick={onClose}>
              Entendido
            </button>
          </>
        }
      >
        <SheetIcon tone="amber">
          <CarIcon className="h-7 w-7" />
        </SheetIcon>
        <h2 id={TITLE_ID} className="profile-sheet-title">
          No puedes cambiar de modo durante un viaje en curso
        </h2>
        <div className="mt-4 rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="status-chip status-chip-green">En curso</span>
            {startedAt ? (
              <span className="text-sm tabular-nums text-[var(--text-muted)]">
                Salió {formatLimaTime(startedAt)}
              </span>
            ) : null}
          </div>
          {trip.origin || trip.destination ? (
            // Cada lugar es un bloque en línea: si la ruta no cabe, se parte entre los lugares
            // y no dentro de un nombre como «Víctor Larco».
            <p className="mt-2 font-semibold text-[var(--text-primary)]">
              <span className="inline-block">{trip.origin}</span>{" "}
              <span aria-label="a">→</span>{" "}
              <span className="inline-block">{trip.destination}</span>
            </p>
          ) : null}
        </div>
        <p className="mt-4 text-center text-[var(--text-brown)]">
          Finaliza el viaje en Mis viajes y luego vuelve a intentarlo.
        </p>
      </ConfirmSheet>
    );
  }

  if (step.kind === "vehicle-required") {
    return (
      <ConfirmSheet
        titleId={TITLE_ID}
        isBusy={false}
        error={null}
        onClose={onClose}
        actions={
          <>
            <Link to="/perfil/vehiculo" className="auth-button-primary">
              Registrar vehículo
            </Link>
            <button type="button" className="profile-sheet-secondary" onClick={onClose}>
              Cancelar
            </button>
          </>
        }
      >
        <SheetIcon tone="brand">
          <CarIcon className="h-7 w-7" />
        </SheetIcon>
        <h2 id={TITLE_ID} className="profile-sheet-title">
          Registra un vehículo para usar la modalidad de conductor
        </h2>
      </ConfirmSheet>
    );
  }

  const copy = COPY[step.target];
  return (
    <ConfirmSheet
      titleId={TITLE_ID}
      isBusy={isBusy}
      error={error}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="auth-button-primary"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Cambiando..." : "Confirmar"}
          </button>
          <button
            type="button"
            className="profile-sheet-secondary"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancelar
          </button>
        </>
      }
    >
      <SheetIcon tone="brand">
        {step.target === "PASSENGER" ? (
          <UserIcon className="h-7 w-7" />
        ) : (
          <CarIcon className="h-7 w-7" />
        )}
      </SheetIcon>
      <h2 id={TITLE_ID} className="profile-sheet-title">
        {copy.title}
      </h2>
      <p className="mt-2 text-center text-[var(--text-brown)]">{copy.body}</p>
      {copy.note ? (
        <p className="mt-4 flex items-start gap-2 text-[0.8125rem] text-[var(--text-muted)]">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {copy.note}
        </p>
      ) : null}
    </ConfirmSheet>
  );
}
