import Cookies from "js-cookie";

const COOKIE_NAME = import.meta.env.VITE_AUTH_COOKIE_NAME ?? "app_auth_token";
const VERIFIED_COOKIE_NAME =
  import.meta.env.VITE_AUTH_VERIFIED_COOKIE_NAME ?? "app_auth_verified";
const PENDING_PROFILE_KEY = "pending_profile_registration";

const getApiBase = () =>
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

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
  department: string;
  district: string;
  campus: string;
  hasVehicle: boolean;
  registrationId?: string;
};

export const authService = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${getApiBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    const data = await response.json();
    Cookies.set(COOKIE_NAME, data.token ?? "demo-token", {
      expires: 7,
      sameSite: "lax",
    });
    Cookies.remove(VERIFIED_COOKIE_NAME);
    return data;
  },
  register: async (payload: { email: string; password: string }) => {
    const response = await fetch(`${getApiBase()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("No se pudo registrar el usuario");
    }

    const data = await response.json();
    sessionStorage.setItem(
      PENDING_PROFILE_KEY,
      JSON.stringify({
        registrationId: data.registrationId,
        email: payload.email,
        name: "",
      }),
    );
    return data;
  },
  verifyCode: async (code: string) => {
    const response = await fetch(`${getApiBase()}/auth/verify-code`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ?? "Código inválido");
    }

    Cookies.set(VERIFIED_COOKIE_NAME, "true", {
      expires: 7,
      sameSite: "lax",
    });

    return data;
  },
  resendCode: async () => {
    const response = await fetch(`${getApiBase()}/auth/resend-code`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("No se pudo reenviar el código");
    }

    return response.json() as Promise<{ message: string }>;
  },
  completeProfile: async (payload: CompleteProfilePayload) => {
    const response = await fetch(`${getApiBase()}/auth/complete-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ?? "No se pudo completar el perfil");
    }

    sessionStorage.removeItem(PENDING_PROFILE_KEY);
    return data;
  },
  getPendingProfileRegistration: () => {
    const raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as {
        registrationId: string;
        email: string;
        name: string;
      };
    } catch {
      return null;
    }
  },
  logout: async () => {
    const token = Cookies.get(COOKIE_NAME);

    const response = await fetch(`${getApiBase()}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
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
