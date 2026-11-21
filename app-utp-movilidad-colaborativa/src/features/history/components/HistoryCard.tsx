import { Link } from "react-router-dom";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { Stars } from "@/features/ratings/components/Stars";
import type { HistoryEntry } from "@/features/history/types";
import { formatDeadline, formatHistoryDate, plural } from "@/features/history/utils";
import { GoldCoinIcon } from "@/shared/icons";
import PlusIcon from "@/assets/images/icons/plus-circle.svg?react";
import RefundIcon from "@/assets/images/icons/refund.svg?react";
import StarIcon from "@/assets/images/icons/star.svg?react";
import UserOffIcon from "@/assets/images/icons/user-off.svg?react";

const GRAY = "bg-[var(--surface-muted)] text-[var(--text-muted)]";
const RED = "bg-[var(--brand-soft)] text-[var(--brand-red)]";
const AMBER = "border border-[var(--amber-border)] bg-[var(--amber-soft)] text-[var(--amber-text)]";

/** Etiquetas de la sección 2.3 del README, según el rol con el que se mira el viaje. */
function statusChip(entry: HistoryEntry) {
  const isDriver = entry.role === "DRIVER";
  if (entry.status === "COMPLETED") {
    return { label: isDriver ? "Completado" : "Completada", tone: GRAY };
  }
  if (entry.status === "NO_SHOW") {
    return { label: "No te presentaste", tone: AMBER };
  }
  if (entry.cancelledBy === "SYSTEM") {
    return { label: "Cancelado: no se inició", tone: RED };
  }
  if (isDriver) {
    return { label: "Cancelado", tone: RED };
  }
  return {
    label: entry.cancelledBy === "PASSENGER" ? "Cancelada por ti" : "Cancelado por el conductor",
    tone: RED,
  };
}

const vehicleLabel = (vehicle: HistoryEntry["vehicle"]) =>
  vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.color.toLowerCase()} • ${vehicle.plate}` : null;

function Route({ entry }: { entry: HistoryEntry }) {
  return (
    <p className="mt-2 text-[0.9375rem] text-[var(--text-primary)]">
      {entry.origin.label} <span className="text-[var(--brand-red)]">→</span> {entry.destination.label}
    </p>
  );
}

function DriverRow({ entry }: { entry: HistoryEntry }) {
  const driver = entry.driver;
  if (!driver) {
    return null;
  }
  const vehicle = vehicleLabel(entry.vehicle);
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <DriverAvatar name={driver.name} photoUrl={driver.photoUrl} className="history-avatar" />
        <p className="min-w-0 flex-1 text-[0.9375rem] text-[var(--text-primary)]">
          {driver.name}{" "}
          {driver.rating ? (
            <span className="text-sm text-[var(--text-muted)]">
              <span className="text-[#f59e0b]">★</span> {driver.rating.average.toFixed(1)}
            </span>
          ) : null}
        </p>
        {entry.seats ? (
          <span className="shrink-0 whitespace-nowrap text-sm text-[var(--text-muted)]">
            {plural(entry.seats, "plaza", "plazas")}
          </span>
        ) : null}
      </div>
      {vehicle && entry.status === "COMPLETED" ? (
        <p className="ml-9 text-sm text-[var(--text-muted)]">{vehicle}</p>
      ) : null}
    </div>
  );
}

function PassengersRow({ entry }: { entry: HistoryEntry }) {
  const passengers = entry.passengers ?? [];
  const noShows = entry.noShows ?? 0;
  const names =
    passengers.length === 1
      ? `${passengers[0].name} · ${plural(passengers[0].seats, "plaza", "plazas")}`
      : passengers.map((passenger) => passenger.name).join(" · ");
  return (
    <div className="mt-3 space-y-1">
      {passengers.length ? (
        <div className="flex items-center gap-2">
          <span className="flex shrink-0">
            {passengers.slice(0, 3).map((passenger) => (
              <DriverAvatar
                key={passenger.bookingId}
                name={passenger.name}
                photoUrl={passenger.photoUrl}
                className="history-avatar"
              />
            ))}
          </span>
          <p className="min-w-0 text-[0.9375rem] text-[var(--text-primary)]">{names}</p>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Nadie subió a este viaje</p>
      )}
      {noShows ? (
        <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
          <UserOffIcon className="h-4 w-4" aria-hidden="true" />
          {noShows === 1 ? "1 pasajero no se presentó" : `${noShows} pasajeros no se presentaron`}
        </p>
      ) : null}
    </div>
  );
}

function Credits({ entry }: { entry: HistoryEntry }) {
  const { credits } = entry;
  const amount = plural(credits, "crédito", "créditos");
  if (entry.role === "DRIVER") {
    return credits > 0 ? (
      <p className="flex items-center gap-1.5 text-[0.9375rem] font-medium text-[var(--credit-green)] tabular-nums">
        <PlusIcon className="h-4 w-4" aria-hidden="true" />+{amount} cobrados
      </p>
    ) : (
      <p className="text-[0.9375rem] text-[var(--text-muted)] tabular-nums">0 créditos cobrados</p>
    );
  }
  if (credits === 0) {
    return null;
  }
  if (entry.status === "CANCELLED") {
    return (
      <p className="flex items-center gap-1.5 text-[0.9375rem] text-[var(--credit-green)] tabular-nums">
        <RefundIcon className="h-4 w-4" aria-hidden="true" />
        Te devolvimos {amount}
      </p>
    );
  }
  if (entry.status === "NO_SHOW") {
    return (
      <p className="text-[0.9375rem] text-[var(--text-muted)] tabular-nums">
        Se pagaron {amount} al conductor
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-[0.9375rem] text-[var(--text-primary)] tabular-nums">
      <GoldCoinIcon className="h-5 w-5" />
      Pagaste {amount}
    </p>
  );
}

function CancelledNote({ entry }: { entry: HistoryEntry }) {
  const refunded = entry.refundedBookings ?? 0;
  const lead =
    entry.cancelledBy === "SYSTEM" ? "No iniciaste el viaje a tiempo." : "Cancelaste este viaje.";
  return (
    <p className="mt-3 text-[0.9375rem] text-[var(--text-muted)]">
      {lead}
      {refunded ? ` Devolvimos los créditos de ${plural(refunded, "reserva", "reservas")}.` : ""}
    </p>
  );
}

/** Calificación dada, botón «Calificar» con su plazo, o el plazo vencido (19-A, 19-B; RN-47). */
function RatingArea({ entry }: { entry: HistoryEntry }) {
  const rating = entry.rating;
  if (!rating) {
    return null;
  }
  const isDriver = entry.role === "DRIVER";
  const total = rating.pending + rating.given.length;
  if (total === 0) {
    return null;
  }
  const deadline = rating.deadline ? new Date(rating.deadline) : null;
  // El plazo puede vencer con la pantalla abierta.
  const open = rating.open && deadline !== null && deadline.getTime() > Date.now();

  let given = null;
  if (rating.given.length) {
    const average = rating.given.reduce((sum, item) => sum + item.score, 0) / rating.given.length;
    given = !isDriver ? (
      <div className="history-rating-box">
        <span>Tu calificación</span>
        <Stars score={rating.given[0].score} />
      </div>
    ) : total === 1 ? (
      <div className="history-rating-box">
        <span>Calificaste a {rating.given[0].name}</span>
        <Stars score={rating.given[0].score} />
      </div>
    ) : (
      <div className="history-rating-box">
        <span>
          Calificaste a {rating.given.length} de {total} pasajeros
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)] tabular-nums">
          <span className="text-[#f59e0b]">★</span> {average.toFixed(1)}
        </span>
      </div>
    );
  }

  return (
    <>
      {given}
      {rating.pending > 0 && open && deadline ? (
        <>
          <Link
            to={`/calificar/${entry.rideId}?origen=historial`}
            className="history-rate-button"
          >
            <StarIcon className="h-5 w-5" aria-hidden="true" />
            {isDriver
              ? `Calificar pasajeros (${rating.pending})`
              : `Calificar a ${entry.driver?.name ?? "tu conductor"}`}
          </Link>
          <p className="mt-2 text-center text-sm text-[var(--text-muted)] tabular-nums">
            Puedes calificar hasta {formatDeadline(deadline)}
          </p>
        </>
      ) : null}
      {rating.pending > 0 && !open && !rating.given.length ? (
        <p className="mt-3 text-sm italic text-[var(--text-muted)]">
          El plazo para calificar este viaje terminó
        </p>
      ) : null}
    </>
  );
}

/** Tarjeta compacta de un viaje terminado. No se puede tocar: solo «Calificar» lleva a P20. */
export function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const chip = statusChip(entry);
  const isDriver = entry.role === "DRIVER";
  const muted = entry.status !== "COMPLETED";

  return (
    <article className={`history-card ${muted ? "history-card-muted" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <p className="whitespace-nowrap text-base font-semibold text-[var(--text-primary)] tabular-nums">
          {formatHistoryDate(new Date(entry.departureTime))}
        </p>
        <span className={`history-chip ${chip.tone}`}>{chip.label}</span>
      </div>
      {entry.campus?.city ? (
        <div>
          <span className="ride-city-chip mt-2">Sede {entry.campus.city}</span>
        </div>
      ) : null}
      <Route entry={entry} />

      {isDriver ? (
        entry.status === "COMPLETED" ? (
          <PassengersRow entry={entry} />
        ) : (
          <CancelledNote entry={entry} />
        )
      ) : (
        <DriverRow entry={entry} />
      )}

      {isDriver || entry.credits > 0 ? (
        <div className="history-divider">
          <Credits entry={entry} />
        </div>
      ) : null}
      <RatingArea entry={entry} />
    </article>
  );
}
