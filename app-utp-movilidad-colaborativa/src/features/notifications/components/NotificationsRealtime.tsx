import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import CloseIcon from "@/assets/images/icons/close.svg?react";
import { NotificationIcon } from "@/features/notifications/components/NotificationIcon";
import {
  applyNewNotification,
  applyUnreadCount,
  useMarkRead,
} from "@/features/notifications/hooks/useNotifications";
import { openNotificationStream } from "@/features/notifications/services/notificationStream";
import { destinationOf } from "@/features/notifications/utils";
import type { AppNotification } from "@/features/notifications/types";

const TOAST_MS = 5_000;
const INBOX_PATH = "/notificaciones";

/**
 * Notificaciones en tiempo real (RF-13): mantiene abierto el stream SSE mientras hay sesión,
 * actualiza el contador y la bandeja, y muestra un aviso breve con cada notificación nueva.
 * Al tocar el aviso se marca como leída y se abre la pantalla relacionada.
 */
export function NotificationsRealtime() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const markRead = useMarkRead();
  const [toast, setToast] = useState<AppNotification | null>(null);
  const onInbox = useRef(false);
  onInbox.current = location.pathname === INBOX_PATH;

  useEffect(() => {
    const stream = openNotificationStream({
      onNotification: (event) => {
        applyNewNotification(queryClient, event);
        // En la bandeja la nueva ya aparece arriba: no hace falta el aviso.
        if (!onInbox.current) {
          setToast(event.notification);
        }
      },
      onUnreadCount: (unreadCount) => applyUnreadCount(queryClient, unreadCount),
    });
    // El WebView suspende la conexión en segundo plano: al volver, se reconecta sin esperar.
    const reconnect = () => {
      if (document.visibilityState === "visible") {
        stream.reconnectNow();
      }
    };
    document.addEventListener("visibilitychange", reconnect);
    window.addEventListener("online", reconnect);
    return () => {
      document.removeEventListener("visibilitychange", reconnect);
      window.removeEventListener("online", reconnect);
      stream.close();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const open = (notification: AppNotification) => {
    setToast(null);
    markRead.mutate(notification);
    navigate(destinationOf(notification));
  };

  return (
    <div className="notification-toast-region" role="status" aria-live="polite">
      {toast ? (
        <div className="notification-toast">
          <button type="button" className="notification-toast-body" onClick={() => open(toast)}>
            <NotificationIcon type={toast.type} />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-semibold text-[var(--text-primary)]">{toast.title}</span>
              <span className="line-clamp-2 text-sm text-[var(--text-brown)]">{toast.message}</span>
            </span>
          </button>
          <button
            type="button"
            className="notification-toast-close"
            aria-label="Cerrar aviso"
            onClick={() => setToast(null)}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
