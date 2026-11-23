import { isSessionExpiredError, session } from "@/shared/auth/session";
import { API_BASE_URL } from "@/shared/config/env";
import type { NewNotificationEvent, UnreadCount } from "@/features/notifications/types";

type StreamHandlers = {
  onNotification: (event: NewNotificationEvent) => void;
  onUnreadCount: (unreadCount: number) => void;
};

export type NotificationStream = {
  /** Reconecta ya, sin esperar el backoff (por ejemplo, al volver la app a primer plano). */
  reconnectNow: () => void;
  close: () => void;
};

const MAX_DELAY_MS = 30_000;

/**
 * Stream SSE de `GET /notifications/stream` (RF-13). Usa `fetch` y no `EventSource` porque
 * `EventSource` no permite enviar el header `Authorization`. Si la conexión se corta, se
 * reconecta con backoff exponencial; al conectar, el servidor envía el contador, así que no
 * se pierde nada. Un 401 `UNAUTHORIZED` cierra la sesión como en el resto de la API.
 */
export function openNotificationStream(handlers: StreamHandlers): NotificationStream {
  let stopped = false;
  let connected = false;
  let attempt = 0;
  let retryMs = 3_000;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const dispatch = (event: string, data: string) => {
    if (!data) {
      return;
    }
    try {
      if (event === "notification") {
        handlers.onNotification(JSON.parse(data) as NewNotificationEvent);
      } else if (event === "unread-count") {
        handlers.onUnreadCount((JSON.parse(data) as UnreadCount).unreadCount);
      }
    } catch {
      // Un evento ilegible no corta el stream.
    }
  };

  // Formato text/event-stream: bloques separados por una línea vacía; `:` es un comentario (ping).
  const parseBlock = (block: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(":")) {
        continue;
      }
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") {
        event = value;
      } else if (field === "data") {
        data.push(value);
      } else if (field === "retry" && /^\d+$/.test(value)) {
        retryMs = Number(value);
      }
    }
    dispatch(event, data.join("\n"));
  };

  const schedule = (delay: number) => {
    clearTimeout(timer);
    if (!stopped) {
      timer = setTimeout(connect, delay);
    }
  };

  const nextDelay = () => {
    const delay = Math.min(MAX_DELAY_MS, retryMs * 2 ** attempt);
    attempt += 1;
    return delay + Math.random() * 500;
  };

  async function connect() {
    const token = session.getToken();
    if (stopped || !token) {
      return;
    }
    controller = new AbortController();
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 401) {
        const body = await response.json().catch(() => null);
        if (isSessionExpiredError(401, body)) {
          session.expire();
        }
        return;
      }
      if (!response.ok || !response.body) {
        throw new Error(`Stream de notificaciones: ${response.status}`);
      }
      connected = true;
      attempt = 0;
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += value;
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? "";
        blocks.forEach(parseBlock);
      }
      // El servidor cerró (vence el token o la conexión llegó a su tope): se reconecta.
      connected = false;
      schedule(retryMs);
    } catch {
      connected = false;
      if (!stopped && !controller?.signal.aborted) {
        schedule(nextDelay());
      }
    }
  }

  connect();

  return {
    reconnectNow: () => {
      if (stopped || connected) {
        return;
      }
      controller?.abort();
      attempt = 0;
      schedule(0);
    },
    close: () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
    },
  };
}
