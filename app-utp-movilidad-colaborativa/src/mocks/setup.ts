import { USE_MOCKS } from "@/shared/config/env";

export async function enableMocking() {
  if (!USE_MOCKS) {
    return;
  }

  // Import dinámico: sin mocks, MSW y los datos de prueba no se cargan.
  const { worker } = await import("@/mocks/browser");

  return worker.start({
    onUnhandledRequest: "bypass",
  });
}
