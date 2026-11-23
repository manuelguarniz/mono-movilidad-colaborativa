import { http, HttpResponse } from "msw";
import { db, saveDb } from "@/mocks/db";
import { api, apiError, authenticate, isObjectId, validationError } from "@/mocks/http";
import { publishUnreadCount, subscribe, unreadOf } from "@/mocks/notifications";

const encoder = new TextEncoder();
const PING_MS = 25_000;

export const notificationHandlers = [
  http.get(api("/notifications"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    const data = db.notifications
      .filter((item) => item.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
      .map(({ userId: _userId, ...item }) => item);
    return HttpResponse.json({ data, unreadCount: unreadOf(user.id) });
  }),

  http.get(api("/notifications/unread-count"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    return HttpResponse.json({ unreadCount: unreadOf(user.id) });
  }),

  http.post(api("/notifications/read-all"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    db.notifications.forEach((item) => {
      if (item.userId === user.id) {
        item.read = true;
      }
    });
    saveDb();
    publishUnreadCount(user.id);
    return HttpResponse.json({ unreadCount: 0 });
  }),

  http.post(api("/notifications/:notificationId/read"), ({ request, params }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    if (!isObjectId(params.notificationId)) {
      return validationError([{ field: "notificationId", message: "El parámetro notificationId no es válido" }]);
    }
    // RN-34: una ajena responde como inexistente.
    const notification = db.notifications.find(
      (item) => item.id === params.notificationId && item.userId === user.id,
    );
    if (!notification) {
      return apiError(404, "NOTIFICATION_NOT_FOUND", "Notificación no encontrada");
    }
    notification.read = true;
    saveDb();
    publishUnreadCount(user.id);
    return HttpResponse.json({ unreadCount: unreadOf(user.id) });
  }),

  // SSE simulado: el contador al conectar y luego los eventos que publica `notify`.
  http.get(api("/notifications/stream"), ({ request }) => {
    const user = authenticate(request);
    if (user instanceof Response) {
      return user;
    }
    let cleanup = () => {};
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const write = (text: string) => {
          try {
            controller.enqueue(encoder.encode(text));
          } catch {
            cleanup();
          }
        };
        const send = (event: string, data: unknown) => write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        write("retry: 3000\n\n");
        send("unread-count", { unreadCount: unreadOf(user.id) });
        const unsubscribe = subscribe(user.id, send);
        const ping = setInterval(() => write(": ping\n\n"), PING_MS);
        cleanup = () => {
          clearInterval(ping);
          unsubscribe();
        };
        request.signal.addEventListener("abort", () => {
          cleanup();
          try {
            controller.close();
          } catch {
            // Ya estaba cerrado.
          }
        });
      },
      cancel() {
        cleanup();
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }),
];
