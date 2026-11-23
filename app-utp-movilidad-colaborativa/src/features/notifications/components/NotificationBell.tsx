import { Link } from "react-router-dom";
import BellIcon from "@/assets/images/icons/bell.svg?react";
import { useUnreadCount } from "@/features/notifications/hooks/useNotifications";
import { badgeLabel } from "@/features/notifications/utils";

/** Campana del encabezado con el número de no leídas (RF-13). */
export function NotificationBell() {
  const { data: unread = 0 } = useUnreadCount();

  return (
    <Link
      to="/notificaciones"
      className="dashboard-bell-button relative"
      aria-label={`Notificaciones, ${unread} sin leer`}
    >
      <BellIcon className="h-6 w-6" />
      {unread > 0 ? (
        <span className="notification-badge" aria-hidden="true">
          {badgeLabel(unread)}
        </span>
      ) : null}
    </Link>
  );
}
