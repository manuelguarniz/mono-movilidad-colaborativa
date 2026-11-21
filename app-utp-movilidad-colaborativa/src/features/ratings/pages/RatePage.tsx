import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DriverAvatar } from "@/features/dashboard/components/DriverAvatar";
import { formatDeadline, formatHistoryDate, formatTripDay } from "@/features/history/utils";
import { errorMessage } from "@/features/my-rides/utils";
import { RatingSuccessSheet } from "@/features/ratings/components/RatingSuccessSheet";
import { StarInput } from "@/features/ratings/components/Stars";
import { ratingService } from "@/features/ratings/services/ratingService";
import type { RatingTarget } from "@/features/ratings/types";
import { COMMENT_MAX, SCORE_LABEL, firstName } from "@/features/ratings/utils";
import { ApiError } from "@/shared/api/apiClient";
import ArrowLeftIcon from "@/assets/images/icons/arrow-left.svg?react";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";

const TOAST_MS = 3000;

type Done = { message: string; score?: number; comment?: string | null };

// Solo orígenes conocidos: evita redirigir a otro sitio con `?origen=`.
const ORIGINS: Record<string, string> = { historial: "/historial", "mis-viajes": "/mis-viajes" };

const vehicleLabel = (target: RatingTarget) =>
  target.vehicle
    ? `${target.vehicle.brand} ${target.vehicle.model} ${target.vehicle.color.toLowerCase()} • ${target.vehicle.plate}`
    : null;

/**
 * Calificar (P20). El pasajero califica a su conductor (20-A) y el conductor, uno por uno, a
 * los pasajeros que subieron y aún no calificó (20-B). Cada calificación se envía por
 * separado (secuencia 8.4). Con el plazo vencido se muestra 20-D.
 */
export function RatePage() {
  const { rideId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const origin = searchParams.get("origen") ?? "historial";
  const returnTo = ORIGINS[origin] ?? "/historial";

  const contextQuery = useQuery({
    queryKey: ["ratings", rideId],
    queryFn: () => ratingService.getContext(rideId),
    // La cola se arma una vez: no debe cambiar mientras se califica.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const context = contextQuery.data;

  // Quienes faltan calificar, en el orden de la API; se fija al cargar.
  const queue = useMemo(() => context?.targets.filter((target) => !target.rated) ?? [], [context]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [rated, setRated] = useState(0);
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const leave = () => {
    queryClient.invalidateQueries({ queryKey: ["history"] });
    queryClient.removeQueries({ queryKey: ["ratings", rideId] });
    navigate(returnTo, {
      replace: true,
      state: origin === "mis-viajes" ? { toast: "Viaje finalizado" } : undefined,
    });
  };

  const isDriver = context?.role === "DRIVER";
  const target = queue[index] ?? (expired || !context?.open ? context?.targets[0] : undefined);
  const isLast = index >= queue.length - 1;
  const next = queue[index + 1];

  // Pasa a la siguiente persona o, al terminar, muestra el cierre del conductor.
  const advance = (ratedNow: boolean) => {
    const total = rated + (ratedNow ? 1 : 0);
    setRated(total);
    setScore(0);
    setComment("");
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    if (total === 0) {
      leave();
      return;
    }
    setDone({
      message:
        total === queue.length
          ? `Calificaste a ${total === 1 ? "1 pasajero" : `${total} pasajeros`}.`
          : `Calificaste a ${total} de ${queue.length} pasajeros.`,
    });
  };

  const rateMutation = useMutation({
    mutationFn: () => ratingService.rate(target!.bookingId, score, comment),
    onSuccess: (rating) => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      if (!isDriver) {
        setDone({
          message: `Calificaste a ${target!.name} por tu viaje ${formatTripDay(new Date(context!.ride.departureTime))}.`,
          score: rating.score,
          comment: rating.comment,
        });
        return;
      }
      advance(true);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "RATING_WINDOW_CLOSED") {
        setExpired(true);
      } else if (error instanceof ApiError && error.code === "ALREADY_RATED") {
        setToast("Ya calificaste a esta persona en este viaje");
        if (isDriver) {
          advance(false);
        } else {
          leave();
        }
      }
    },
  });

  // Toda la cola ya estaba calificada (por ejemplo, al volver con el botón del navegador).
  useEffect(() => {
    if (context && context.open && !expired && queue.length === 0) {
      leave();
    }
  }, [context, queue.length, expired]);

  const header = (
    <header className="publish-header">
      <button type="button" className="publish-header-button" aria-label="Volver" onClick={leave}>
        <ArrowLeftIcon className="h-6 w-6" />
      </button>
      <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">Calificar viaje</h1>
    </header>
  );

  if (contextQuery.isLoading) {
    return (
      <div className="publish-screen">
        {header}
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando...</p>
      </div>
    );
  }
  if (!context || !target) {
    return (
      <div className="publish-screen">
        {header}
        <div className="mx-auto w-full max-w-lg px-[var(--webview-px)]">
          {contextQuery.isError ? (
            <div className="dashboard-alert" role="alert">
              <p className="flex-1">{errorMessage(contextQuery.error)}</p>
              <button type="button" className="shrink-0 font-semibold underline" onClick={() => contextQuery.refetch()}>
                Reintentar
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const closed = expired || !context.open;
  const deadline = context.deadline ? new Date(context.deadline) : null;
  const otherError =
    rateMutation.isError &&
    !(rateMutation.error instanceof ApiError && ["RATING_WINDOW_CLOSED", "ALREADY_RATED"].includes(rateMutation.error.code ?? ""))
      ? errorMessage(rateMutation.error)
      : null;
  const vehicle = vehicleLabel(target);
  const isBusy = rateMutation.isPending;

  return (
    <div className="publish-screen">
      {header}

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-[var(--webview-px)] pb-4">
        <section className="rate-trip-box" aria-label="Tu viaje">
          <div className="flex items-center justify-between gap-2">
            <p className="publish-label">Tu viaje</p>
            {context.ride.campus?.city ? (
              <span className="rounded-full border border-[var(--border-neutral)] bg-white px-2.5 py-0.5 text-xs text-[var(--text-brown)]">
                Sede {context.ride.campus.city}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-base font-semibold text-[var(--text-primary)] tabular-nums">
            {formatHistoryDate(new Date(context.ride.departureTime))}
          </p>
          <p className="mt-0.5 text-sm text-[var(--text-brown)]">
            {context.ride.origin.label} → {context.ride.destination.label}
          </p>
        </section>

        {closed ? (
          <div className="dashboard-alert items-center" role="alert">
            <ClockIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p>El plazo para calificar este viaje terminó</p>
          </div>
        ) : null}

        {isDriver && !closed && queue.length > 0 ? (
          <div>
            <p className="text-[0.9375rem] text-[var(--text-brown)] tabular-nums">
              Pasajero {index + 1} de {queue.length}
            </p>
            <div
              className="rate-progress"
              style={{ gridTemplateColumns: `repeat(${queue.length}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {queue.map((item, position) => (
                <span
                  key={item.bookingId}
                  className={`rate-progress-segment ${position <= index ? "bg-[var(--brand-red)]" : ""}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <section className="rate-person-card" aria-labelledby="rate-question">
          <DriverAvatar name={target.name} photoUrl={target.photoUrl} className="rate-avatar" />
          <p className="mt-3 text-xl font-semibold text-[var(--text-primary)]">{target.name}</p>
          <p className="text-sm text-[var(--text-muted)]">
            {target.role === "DRIVER"
              ? ["Tu conductor", vehicle].filter(Boolean).join(" · ")
              : `Pasajero · ${target.seats === 1 ? "1 plaza" : `${target.seats ?? 1} plazas`}`}
          </p>
          <hr className="my-4 border-[var(--border-neutral)]" />
          <p id="rate-question" className="text-lg font-semibold text-[var(--text-primary)]">
            {target.role === "DRIVER"
              ? `¿Cómo fue tu viaje con ${firstName(target.name)}?`
              : `¿Cómo fue viajar con ${firstName(target.name)}?`}
          </p>
          <div className="mt-3">
            <StarInput value={closed ? 0 : score} onChange={setScore} disabled={closed || isBusy} labelledBy="rate-question" />
          </div>
          {closed ? null : (
            <p
              className={`mt-2 text-[0.9375rem] ${score ? "font-medium text-[var(--text-brown)]" : "text-[var(--text-muted)]"}`}
              aria-live="polite"
            >
              {score ? SCORE_LABEL[score] : "Toca una estrella para calificar"}
            </p>
          )}
        </section>

        <div>
          <label htmlFor="rate-comment" className="mb-1.5 block text-[0.9375rem] text-[var(--text-primary)]">
            Comentario (opcional)
          </label>
          <div className="relative">
            <textarea
              id="rate-comment"
              rows={3}
              maxLength={COMMENT_MAX}
              className="rate-textarea"
              placeholder={closed ? undefined : "Cuéntanos cómo te fue"}
              value={closed ? "" : comment}
              disabled={closed || isBusy}
              aria-describedby="rate-comment-count"
              onChange={(event) => setComment(event.target.value.slice(0, COMMENT_MAX))}
            />
            <span
              id="rate-comment-count"
              className={`pointer-events-none absolute bottom-2.5 right-4 text-sm tabular-nums ${
                comment.length >= COMMENT_MAX && !closed ? "text-[var(--brand-red)]" : "text-[var(--text-muted)]"
              }`}
            >
              {closed ? 0 : comment.length}/{COMMENT_MAX}
            </span>
          </div>
        </div>

        {!closed && deadline ? (
          <p className="flex items-start gap-2 text-[0.9375rem] text-[var(--text-muted)]">
            <InfoIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              Puedes calificar hasta {formatDeadline(deadline)}.
              {isDriver ? "" : " Después de enviarla no podrás cambiarla."}
            </span>
          </p>
        ) : null}
      </main>

      <footer className="rate-footer">
        <div className="mx-auto w-full max-w-lg">
          {otherError ? (
            <div className="dashboard-alert mb-3" role="alert">
              <p>{otherError}</p>
            </div>
          ) : null}
          {closed ? (
            <button type="button" className="my-rides-soft-button h-[3.25rem] w-full text-lg" onClick={leave}>
              {origin === "historial" ? "Volver al historial" : "Volver"}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="publish-submit"
                disabled={!score || isBusy}
                onClick={() => rateMutation.mutate()}
              >
                {isBusy
                  ? "Enviando..."
                  : isDriver && !isLast && next
                    ? `Enviar y seguir con ${next.name}`
                    : "Enviar calificación"}
              </button>
              <button
                type="button"
                className="mt-1 w-full py-3 text-[0.9375rem] font-medium text-[var(--text-muted)]"
                disabled={isBusy}
                onClick={() => (isDriver ? advance(false) : leave())}
              >
                {isDriver ? `Omitir a ${target.name}` : "Ahora no"}
              </button>
            </>
          )}
        </div>
      </footer>

      {toast ? (
        <p className="app-toast" role="status">
          {toast}
        </p>
      ) : null}

      {done ? (
        <RatingSuccessSheet message={done.message} score={done.score} comment={done.comment} onDone={leave} />
      ) : null}
    </div>
  );
}
