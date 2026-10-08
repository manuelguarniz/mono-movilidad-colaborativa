import { worker } from "@/mocks/browser";

export async function enableMocking() {
  if (!import.meta.env.DEV) {
    return;
  }

  return worker.start({
    onUnhandledRequest: "bypass",
  });
}
