import Cookies from "js-cookie";
import { API_BASE_URL } from "@/shared/config/env";

const COOKIE_NAME = import.meta.env.VITE_AUTH_COOKIE_NAME ?? "app_auth_token";
const VERIFIED_COOKIE_NAME =
  import.meta.env.VITE_AUTH_VERIFIED_COOKIE_NAME ?? "app_auth_verified";
const PENDING_PROFILE_KEY = "pending_profile_registration";

const getAuthHeaders = () => {
  const token = Cookies.get(COOKIE_NAME);

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

    // Token PRE_AUTH: todavía no da acceso, solo permite verificar o reenviar el código.
    Cookies.set(COOKIE_NAME, data.token, {
      expires: 7,
      sameSite: "lax",
    });
    Cookies.remove(VERIFIED_COOKIE_NAME);
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
      throw new Error(getErrorMessage(data, "Código inválido"));
    }

    // El token SESSION reemplaza al PRE_AUTH del login.
    Cookies.set(COOKIE_NAME, data.token, {
      expires: 7,
      sameSite: "lax",
    });
    Cookies.set(VERIFIED_COOKIE_NAME, "true", {
      expires: 7,
      sameSite: "lax",
    });

    return data;
  },
  resendCode: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
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

    sessionStorage.removeItem(PENDING_PROFILE_KEY);
    return data;
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
    const token = Cookies.get(COOKIE_NAME);

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    Cookies.remove(COOKIE_NAME);
    Cookies.remove(VERIFIED_COOKIE_NAME);
    sessionStorage.removeItem(PENDING_PROFILE_KEY);

    if (!response.ok) {
      throw new Error("No se pudo cerrar sesión");
    }

    return response.json() as Promise<{ message: string }>;
  },
  isAuthenticated: () => Boolean(Cookies.get(COOKIE_NAME)),
  isVerified: () => Cookies.get(VERIFIED_COOKIE_NAME) === "true",
};
