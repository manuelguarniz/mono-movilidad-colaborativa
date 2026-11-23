import { USE_MOCKS } from "@/shared/config/env";

export async function enableMocking() {
  if (!USE_MOCKS) {
    return;
  }

  // Import dinámico: sin mocks, MSW y los datos de prueba no se cargan.
  const { worker } = await import("@/mocks/browser");
  const [{ mockNotifyCurrentUser }, { saveDb }, { session }] = await Promise.all([
    import("@/mocks/notifications"),
    import("@/mocks/db"),
    import("@/shared/auth/session"),
  ]);
  // RF-13 en modo mock: `__mockNotify()` simula que llega una notificación al usuario de la sesión.
  Object.assign(window, {
    __mockNotify: (type?: Parameters<typeof mockNotifyCurrentUser>[1]) => {
      const created = mockNotifyCurrentUser(session.getToken(), type);
      saveDb();
      return created;
    },
  });

  return worker.start({
    onUnhandledRequest: "bypass",
  });
}
