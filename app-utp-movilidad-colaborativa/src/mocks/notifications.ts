import { faker } from "@faker-js/faker";
import {
  db,
  formatDayTime,
  NOTIFICATION_TITLES,
  type MockNotification,
  type MockReservation,
  type MockRide,
  type NotificationType,
} from "@/mocks/db";

/**
 * Notificaciones de la API simulada (RF-13), con los textos del backend (`Notificador`).
 * `notify` hace lo que en el backend hacen el insert y el Change Stream: guarda la notificación y
 * la envía a los streams SSE abiertos del destinatario en esta pestaña.
 */

type Listener = (event: string, data: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

export const unreadOf = (userId: string) =>
  db.notifications.filter((item) => item.userId === userId && !item.read).length;

export function subscribe(userId: string, listener: Listener) {
  const own = listeners.get(userId) ?? new Set<Listener>();
  own.add(listener);
  listeners.set(userId, own);
  return () => {
    own.delete(listener);
  };
}

export function publishUnreadCount(userId: string) {
  listeners.get(userId)?.forEach((listener) => listener("unread-count", { unreadCount: unreadOf(userId) }));
}

export function notify(
  userId: string,
  type: NotificationType,
  message: string,
  extra: Partial<Pick<MockNotification, "assistance" | "rideId" | "bookingId">> = {},
) {
  const notification: MockNotification = {
    id: faker.database.mongodbObjectId(),
    userId,
    type,
    title: NOTIFICATION_TITLES[type],
    message,
    assistance: extra.assistance ?? null,
    rideId: extra.rideId ?? null,
    bookingId: extra.bookingId ?? null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(notification);
  // Se envía después de que el handler guarde, como el Change Stream después del commit.
  queueMicrotask(() =>
    listeners.get(userId)?.forEach((listener) =>
      listener("notification", { notification, unreadCount: unreadOf(userId) }),
    ),
  );
  return notification;
}

const credits = (n: number) => `${n} ${n === 1 ? "crédito" : "créditos"}`;
const names = (list: string[]) =>
  list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} y ${list[list.length - 1]}`;
const ASSISTANCE: Record<string, string> = {
  WHEELCHAIR: "Silla de ruedas",
  CRUTCHES_OR_WALKER: "Muletas o andador",
  OTHER: "Otra",
};

export const notifications = {
  newBooking(ride: MockRide, reservation: MockReservation) {
    const type = reservation.mobilityAssistance?.type;
    notify(
      ride.driver.id,
      "NUEVA_RESERVA",
      `${reservation.passenger.name} reservó ${reservation.seats} plaza(s) en tu viaje del ${formatDayTime(ride.departureTime)}.`,
      {
        assistance: type ? `Necesita asistencia: ${ASSISTANCE[type] ?? "Otra"}.` : null,
        rideId: ride.id,
        bookingId: reservation.id,
      },
    );
  },

  bookingCancelled(ride: MockRide, reservation: MockReservation) {
    const free = ride.availableSeats;
    notify(
      ride.driver.id,
      "RESERVA_CANCELADA",
      `${reservation.passenger.name} canceló su reserva en tu viaje del ${formatDayTime(ride.departureTime)}. ${
        free === 1 ? "Queda 1 plaza libre." : `Quedan ${free} plazas libres.`
      }`,
      { rideId: ride.id, bookingId: reservation.id },
    );
  },

  rideCancelled(ride: MockRide, reservation: MockReservation, refunded: number, reason: string | null) {
    let message = `${ride.driver.name} canceló el viaje del ${formatDayTime(ride.departureTime)} a ${ride.destination.label}.`;
    if (refunded > 0) {
      message += ` Te devolvimos ${credits(refunded)}.`;
    }
    if (reason) {
      message += ` Motivo: ${reason}`;
    }
    notify(reservation.passengerId, "VIAJE_CANCELADO", message, { rideId: ride.id, bookingId: reservation.id });
  },

  started(ride: MockRide, reservation: MockReservation) {
    notify(reservation.passengerId, "VIAJE_INICIADO", `Tu viaje a ${ride.destination.label} inició.`, {
      rideId: ride.id,
      bookingId: reservation.id,
    });
  },

  noShow(ride: MockRide, reservation: MockReservation) {
    notify(
      reservation.passengerId,
      "NO_SE_PRESENTO",
      `El conductor marcó que no subiste al viaje del ${formatDayTime(ride.departureTime)}. Se cobraron ${credits(reservation.totalCredits)}.`,
      { rideId: ride.id, bookingId: reservation.id },
    );
  },

  completed(ride: MockRide, completed: MockReservation[], earned: number) {
    let message = `Tu viaje a ${ride.destination.label} terminó.`;
    if (completed.length > 0) {
      message += ` ¡Califica a ${names(completed.map((item) => item.passenger.name))}!`;
    }
    if (earned > 0) {
      message += ` Recibiste ${credits(earned)}.`;
    }
    notify(ride.driver.id, "VIAJE_COMPLETADO", message, { rideId: ride.id });
    for (const reservation of completed) {
      notify(
        reservation.passengerId,
        "VIAJE_COMPLETADO",
        `Tu viaje a ${ride.destination.label} terminó. ¡Califica a ${ride.driver.name}!`,
        { rideId: ride.id, bookingId: reservation.id },
      );
    }
  },
};

/**
 * Solo en desarrollo con mocks: `window.__mockNotify()` crea una notificación de ejemplo para el
 * usuario de la sesión, para ver el aviso y el contador sin una segunda cuenta.
 */
export function mockNotifyCurrentUser(token: string | undefined, type: NotificationType = "NUEVA_RESERVA") {
  const payload = token && /^mock\.([^.]+)\.token$/.exec(token)?.[1];
  const userId = payload ? (JSON.parse(atob(payload)) as { sub?: string }).sub : undefined;
  if (!userId) {
    return null;
  }
  const examples: Record<NotificationType, string> = {
    NUEVA_RESERVA: "Lucía R. reservó 1 plaza(s) en tu viaje del 29/10 14:20.",
    RESERVA_CANCELADA: "Lucía R. canceló su reserva en tu viaje del 29/10 14:20. Quedan 2 plazas libres.",
    VIAJE_CANCELADO: "Carlos M. canceló el viaje del 29/10 14:20 a Urb. El Golf. Te devolvimos 12 créditos.",
    RECORDATORIO_SALIDA: "Tu viaje a Urb. El Golf sale a las 14:20.",
    VIAJE_INICIADO: "Tu viaje a Urb. El Golf inició.",
    NO_SE_PRESENTO: "El conductor marcó que no subiste al viaje del 29/10 14:20. Se cobraron 6 créditos.",
    VIAJE_COMPLETADO: "Tu viaje a Urb. El Golf terminó. ¡Califica a Carlos M.!",
    RETIRO_RECHAZADO: "Tu retiro de 20 créditos fue rechazado: El número no tiene Yape activo. Te devolvimos los créditos.",
  };
  return notify(userId, type, examples[type], {
    assistance: type === "NUEVA_RESERVA" ? "Necesita asistencia: Silla de ruedas." : null,
  });
}
