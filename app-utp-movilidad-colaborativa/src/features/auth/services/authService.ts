import { isSessionExpiredError, session } from "@/shared/auth/session";
import { API_BASE_URL } from "@/shared/config/env";

const PENDING_PROFILE_KEY = "pending_profile_registration";

const getAuthHeaders = () => {
  const token = session.getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Token vencido o inválido: se cierra la sesión y la app vuelve al login.
const expireSessionIfRejected = (response: Response, data: ApiErrorBody) => {
  if (isSessionExpiredError(response.status, data)) {
    session.expire();
  }
};

export type CompleteProfilePayload = {
  firstName: string;
  lastName: string;
  departmentId: string;
  districtId: string;
  campusId: string;
  photoFileId?: string;
};

type PendingProfileRegistration = {
  // Token REGISTRATION: solo sirve para completar el perfil y registrar el vehículo.
  token: string;
  email: string;
};

type ApiErrorBody = {
  code?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
};

// Con VALIDATION_ERROR el mensaje general es fijo: el detalle está en `errors`.
const getErrorMessage = (data: ApiErrorBody, fallback: string) =>
  data.errors?.[0]?.message ?? data.message ?? fallback;

export const authService = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Credenciales inválidas"));
    }

    session.startPreAuth(data.token, data.expiresIn);
    return data;
  },
  register: async (payload: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, acceptedTerms: true }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "No se pudo registrar el usuario"));
    }

    const pending: PendingProfileRegistration = {
      token: data.token,
      email: payload.email,
    };
    sessionStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(pending));
    return data;
  },
  verifyCode: async (code: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      expireSessionIfRejected(response, data);
      throw new Error(getErrorMessage(data, "Código inválido"));
    }

    session.startSession(data.token, data.expiresIn);

    return data;
  },
  resendCode: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      expireSessionIfRejected(response, data);
      throw new Error(getErrorMessage(data, "No se pudo reenviar el código"));
    }

    return data as { message: string };
  },
  completeProfile: async (payload: CompleteProfilePayload) => {
    const pending = authService.getPendingProfileRegistration();

    const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(pending ? { Authorization: `Bearer ${pending.token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "No se pudo completar el perfil"));
    }

    // El token REGISTRATION se conserva: «Datos del vehículo» todavía lo necesita.
    return data;
  },
  /** Termina el registro: descarta el token REGISTRATION. */
  clearPendingProfileRegistration: () => {
    sessionStorage.removeItem(PENDING_PROFILE_KEY);
  },
  getPendingProfileRegistration: (): PendingProfileRegistration | null => {
    const raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as PendingProfileRegistration;
    } catch {
      return null;
    }
  },
  logout: async () => {
    const headers = getAuthHeaders();

    // La sesión se cierra en el cliente aunque la petición falle.
    session.clear();
    sessionStorage.removeItem(PENDING_PROFILE_KEY);

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      throw new Error("No se pudo cerrar sesión");
    }

    return response.json() as Promise<{ message: string }>;
  },
  isAuthenticated: session.isAuthenticated,
  isVerified: session.isVerified,
};
