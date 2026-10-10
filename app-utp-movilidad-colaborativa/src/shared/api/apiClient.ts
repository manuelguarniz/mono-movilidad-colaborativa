import axios from "axios";
import { isSessionExpiredError, session } from "@/shared/auth/session";
import { API_BASE_URL } from "@/shared/config/env";

export type ApiFieldError = { field: string; message: string };

/**
 * Error de la API con la forma del contrato: `{ code, message, errors? }`. `code` es
 * estable y es lo que se usa para decidir; `message` se puede mostrar al usuario.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly fieldErrors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = session.getToken();

  // Durante el registro la petición trae su propio token (REGISTRATION): no se pisa.
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { status, data } = error?.response ?? {};

    // Token vencido o inválido: se cierra la sesión y la app vuelve al login.
    if (isSessionExpiredError(status, data)) {
      session.expire();
    }

    // Con VALIDATION_ERROR el mensaje general es fijo: el detalle está en `errors`.
    const fieldErrors: ApiFieldError[] = data?.errors ?? [];
    const message =
      fieldErrors[0]?.message ??
      data?.message ??
      "Error de conexión con el backend";

    return Promise.reject(new ApiError(message, status, data?.code, fieldErrors));
  },
);
