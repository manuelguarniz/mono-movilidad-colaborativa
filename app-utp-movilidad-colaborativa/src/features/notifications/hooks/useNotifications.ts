import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { notificationKeys, notificationService } from "@/features/notifications/services/notificationService";
import type {
  AppNotification,
  NewNotificationEvent,
  NotificationInbox,
  NotificationType,
  UnreadCount,
} from "@/features/notifications/types";

/** Contador de la campana. Lo mantiene al día el stream SSE: no se consulta cada cierto tiempo. */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationService.getUnreadCount,
    staleTime: Infinity,
    select: (data) => data.unreadCount,
  });
}

export function useInbox() {
  return useQuery({ queryKey: notificationKeys.inbox, queryFn: notificationService.getInbox });
}

// Datos que cambian con cada tipo: se invalidan para que las pantallas abiertas se refresquen solas.
const RELATED: Record<NotificationType, string[][]> = {
  NUEVA_RESERVA: [["rides"]],
  RESERVA_CANCELADA: [["rides"]],
  VIAJE_CANCELADO: [["bookings"], ["rides"], ["wallet"], ["history"]],
  RECORDATORIO_SALIDA: [],
  VIAJE_INICIADO: [["bookings"], ["history"]],
  NO_SE_PRESENTO: [["bookings"], ["history"]],
  VIAJE_COMPLETADO: [["bookings"], ["rides"], ["wallet"], ["history"]],
  RETIRO_RECHAZADO: [["wallet"]],
};

const MAX_INBOX = 50;

export function applyNewNotification(queryClient: QueryClient, { notification, unreadCount }: NewNotificationEvent) {
  queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, { unreadCount });
  queryClient.setQueryData<NotificationInbox>(notificationKeys.inbox, (inbox) =>
    inbox && !inbox.data.some((item) => item.id === notification.id)
      ? { data: [notification, ...inbox.data].slice(0, MAX_INBOX), unreadCount }
      : inbox,
  );
  RELATED[notification.type].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

/** Contador recibido por SSE (al conectar o al marcar leídas desde otro dispositivo). */
export function applyUnreadCount(queryClient: QueryClient, unreadCount: number) {
  queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, { unreadCount });
  const inbox = queryClient.getQueryData<NotificationInbox>(notificationKeys.inbox);
  if (inbox && inbox.unreadCount !== unreadCount) {
    queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
  }
}

const markLocally = (inbox: NotificationInbox | undefined, id: string | null): NotificationInbox | undefined => {
  if (!inbox) {
    return inbox;
  }
  const data = inbox.data.map((item: AppNotification) =>
    id === null || item.id === id ? { ...item, read: true } : item,
  );
  return { data, unreadCount: data.filter((item) => !item.read).length };
};

/** Marca leída al tocarla; se refleja antes de que responda la API. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notification: AppNotification) => notificationService.markRead(notification.id),
    onMutate: (notification) => {
      if (notification.read) {
        return;
      }
      queryClient.setQueryData<NotificationInbox>(notificationKeys.inbox, (inbox) =>
        markLocally(inbox, notification.id),
      );
      queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, (current) =>
        current ? { unreadCount: Math.max(0, current.unreadCount - 1) } : current,
      );
    },
    onSuccess: (result) => applyUnreadCount(queryClient, result.unreadCount),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onMutate: () => {
      queryClient.setQueryData<NotificationInbox>(notificationKeys.inbox, (inbox) => markLocally(inbox, null));
      queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, { unreadCount: 0 });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
