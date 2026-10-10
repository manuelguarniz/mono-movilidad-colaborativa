import Cookies from "js-cookie";

const TOKEN_COOKIE = import.meta.env.VITE_AUTH_COOKIE_NAME ?? "app_auth_token";
const VERIFIED_COOKIE =
  import.meta.env.VITE_AUTH_VERIFIED_COOKIE_NAME ?? "app_auth_verified";

/** Evento de `window` que se emite cuando la API rechaza el token (401 `UNAUTHORIZED`). */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

// La cookie dura lo mismo que el token (`expiresIn`, en segundos): cuando el token
// vence, la cookie desaparece y la ruta protegida deja de dar acceso.
const cookieOptions = (expiresIn: number) => ({
  expires: new Date(Date.now() + expiresIn * 1000),
  sameSite: "lax" as const,
});

export const session = {
  getToken: () => Cookies.get(TOKEN_COOKIE),
  isAuthenticated: () => Boolean(Cookies.get(TOKEN_COOKIE)),
  isVerified: () => Cookies.get(VERIFIED_COOKIE) === "true",

  /** Token PRE_AUTH del login: solo permite verificar o reenviar el código. */
  startPreAuth: (token: string, expiresIn: number) => {
    Cookies.set(TOKEN_COOKIE, token, cookieOptions(expiresIn));
    Cookies.remove(VERIFIED_COOKIE);
  },

  /** Token SESSION: reemplaza al PRE_AUTH y da acceso a la aplicación. */
  startSession: (token: string, expiresIn: number) => {
    Cookies.set(TOKEN_COOKIE, token, cookieOptions(expiresIn));
    Cookies.set(VERIFIED_COOKIE, "true", cookieOptions(expiresIn));
  },

  clear: () => {
    Cookies.remove(TOKEN_COOKIE);
    Cookies.remove(VERIFIED_COOKIE);
  },

  /** Borra la sesión y avisa a la aplicación para que vuelva al login. */
  expire: () => {
    session.clear();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  },
};

type ApiErrorBody = { code?: string } | null | undefined;

/**
 * `true` si la API rechazó el token: falta, es inválido o venció. Un 401 con otro código
 * (por ejemplo `INVALID_CREDENTIALS` en el login) no es una sesión vencida.
 */
export const isSessionExpiredError = (status?: number, body?: ApiErrorBody) =>
  status === 401 && body?.code === "UNAUTHORIZED";
