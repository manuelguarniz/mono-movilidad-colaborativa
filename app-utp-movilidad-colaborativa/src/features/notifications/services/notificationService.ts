import { apiClient } from "@/shared/api/apiClient";
import type { NotificationInbox, UnreadCount } from "@/features/notifications/types";

export const notificationKeys = {
  all: ["notifications"] as const,
  inbox: ["notifications", "inbox"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export const notificationService = {
  /** Las 50 más recientes, la más nueva primero (RF-13). */
  getInbox: () => apiClient.get<unknown, NotificationInbox>("/notifications"),

  getUnreadCount: () => apiClient.get<unknown, UnreadCount>("/notifications/unread-count"),

  markRead: (id: string) => apiClient.post<unknown, UnreadCount>(`/notifications/${id}/read`),

  markAllRead: () => apiClient.post<unknown, UnreadCount>("/notifications/read-all"),
};
