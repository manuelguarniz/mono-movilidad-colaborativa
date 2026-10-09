const MOCK_API_URL = "http://localhost:3000/api";
const BACKEND_API_URL = "http://localhost:8080/api";

/**
 * `true`: la API se simula con MSW. `false`: las peticiones van al backend real.
 * Se controla con `VITE_USE_MOCKS` y solo aplica en desarrollo: un build nunca usa mocks.
 */
export const USE_MOCKS =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== "false";

/** URL base de la API. `VITE_API_BASE_URL` la reemplaza si hace falta otro host o puerto. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (USE_MOCKS ? MOCK_API_URL : BACKEND_API_URL);
