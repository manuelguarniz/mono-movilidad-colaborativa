/** Tipos de RF-13; el valor es el `type` del contrato. */
export type NotificationType =
  | "NUEVA_RESERVA"
  | "RESERVA_CANCELADA"
  | "VIAJE_CANCELADO"
  | "RECORDATORIO_SALIDA"
  | "VIAJE_INICIADO"
  | "NO_SE_PRESENTO"
  | "VIAJE_COMPLETADO"
  | "RETIRO_RECHAZADO";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** «Necesita asistencia: …», solo en NUEVA_RESERVA para el conductor (RN-22). */
  assistance: string | null;
  rideId: string | null;
  bookingId: string | null;
  read: boolean;
  createdAt: string;
};

/** `GET /notifications`: las 50 más recientes y el contador. */
export type NotificationInbox = { data: AppNotification[]; unreadCount: number };

export type UnreadCount = { unreadCount: number };

/** Dato del evento SSE `notification`. */
export type NewNotificationEvent = { notification: AppNotification; unreadCount: number };
