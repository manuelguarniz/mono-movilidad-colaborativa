import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ArrowLeftIcon from "@/assets/images/icons/arrow-left.svg?react";
import BellIcon from "@/assets/images/icons/bell.svg?react";
import CheckDoubleIcon from "@/assets/images/icons/check-double.svg?react";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { NotificationRow } from "@/features/notifications/components/NotificationRow";
import { useInbox, useMarkAllRead, useMarkRead } from "@/features/notifications/hooks/useNotifications";
import { destinationOf, groupByDay } from "@/features/notifications/utils";
import type { AppNotification } from "@/features/notifications/types";

/** P18 — Notificaciones (RF-13): bandeja agrupada por día, la más reciente primero. */
export function NotificationsPage() {
  const navigate = useNavigate();
  const inbox = useInbox();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const { data: user } = useQuery({ queryKey: ["users", "me"], queryFn: dashboardService.getCurrentUser });

  const items = inbox.data?.data ?? [];
  const unread = inbox.data?.unreadCount ?? 0;
  // Se recalcula con cada cambio de la bandeja (también los que llegan por SSE).
  const now = useMemo(() => Date.now(), [inbox.dataUpdatedAt]);
  const groups = useMemo(() => groupByDay(items, now), [items, now]);

  const open = (notification: AppNotification) => {
    markRead.mutate(notification);
    navigate(destinationOf(notification));
  };

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/dashboard"));
  const isDriver = user?.activeMode === "DRIVER";

  return (
    <div className="publish-screen">
      <header className="publish-header border-b border-[var(--border-neutral)]">
        <button type="button" className="publish-header-button" aria-label="Volver" onClick={goBack}>
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">Notificaciones</h1>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-[var(--webview-px)] pb-8 pt-4">
        {inbox.isPending ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando...</p>
        ) : inbox.isError ? (
          <div className="dashboard-alert" role="alert">
            <p className="flex-1">No pudimos cargar tus notificaciones</p>
            <button type="button" className="shrink-0 font-semibold underline" onClick={() => inbox.refetch()}>
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="notification-empty">
            <span className="notification-empty-icon" aria-hidden="true">
              <BellIcon className="h-10 w-10" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">No tienes notificaciones</h2>
            <p className="mt-2 max-w-xs text-sm text-[var(--text-muted)]">
              Aquí verás los avisos de tus reservas, viajes y calificaciones pendientes.
            </p>
            <button
              type="button"
              className="notification-empty-button"
              onClick={() => navigate(isDriver ? "/viajes/publicar" : "/dashboard")}
            >
              {isDriver ? "Publicar viaje" : "Buscar viajes"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.9375rem] text-[var(--text-brown)] tabular-nums">
                {unread > 0 ? `${unread} sin leer` : "Todo leído"}
              </p>
              <button
                type="button"
                className="notification-mark-all"
                disabled={unread === 0 || markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                <CheckDoubleIcon className="h-5 w-5" aria-hidden="true" />
                Marcar todas como leídas
              </button>
            </div>

            {groups.map((group) => (
              <section key={group.label} className="mt-5" aria-label={group.label}>
                <h2 className="notification-group-label">{group.label}</h2>
                <ul className="notification-card">
                  {group.items.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} now={now} onOpen={open} />
                  ))}
                </ul>
              </section>
            ))}

            <p className="mt-6 text-center text-[0.8125rem] text-[var(--text-muted)]">
              Las notificaciones se borran a los 30 días.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
