import ChevronRightIcon from "@/assets/images/icons/chevron-right.svg?react";
import AccessibleIcon from "@/assets/images/icons/accessible.svg?react";
import { NotificationIcon } from "@/features/notifications/components/NotificationIcon";
import { relativeTime } from "@/features/notifications/utils";
import type { AppNotification } from "@/features/notifications/types";

type Props = {
  notification: AppNotification;
  now: number;
  onOpen: (notification: AppNotification) => void;
};

/** Una fila de la bandeja (P18): las no leídas con punto rojo, fondo rojo suave y título semibold. */
export function NotificationRow({ notification, now, onOpen }: Props) {
  const unread = !notification.read;

  return (
    <li>
      <button
        type="button"
        className={`notification-row ${unread ? "notification-row-unread" : ""}`}
        onClick={() => onOpen(notification)}
      >
        <NotificationIcon type={notification.type} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {unread ? <span className="notification-dot" aria-hidden="true" /> : null}
            <span className={`notification-title ${unread ? "font-semibold" : "font-normal"}`}>
              {notification.title}
            </span>
            {unread ? <span className="sr-only">, sin leer</span> : null}
          </span>
          <span className="notification-message">{notification.message}</span>
          {notification.assistance ? (
            <span className="notification-assistance">
              <AccessibleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {notification.assistance}
            </span>
          ) : null}
          <span className="notification-time">
            <time dateTime={notification.createdAt}>{relativeTime(notification.createdAt, now)}</time>
          </span>
        </span>
        <ChevronRightIcon className="notification-chevron" aria-hidden="true" />
      </button>
    </li>
  );
}
