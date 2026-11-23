import { NOTIFICATION_STYLE, TONE_CLASS } from "@/features/notifications/utils";
import type { NotificationType } from "@/features/notifications/types";

export function NotificationIcon({ type }: { type: NotificationType }) {
  const { icon: Icon, tone } = NOTIFICATION_STYLE[type];
  return (
    <span className={`notification-icon ${TONE_CLASS[tone]}`} aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  );
}
