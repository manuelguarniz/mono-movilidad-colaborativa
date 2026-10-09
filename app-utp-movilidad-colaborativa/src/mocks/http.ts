import { HttpResponse } from "msw";
import { db, type MockUser } from "@/mocks/db";
import { API_BASE_URL } from "@/shared/config/env";

export const api = (path: string) => `${API_BASE_URL}${path}`;

export type FieldError = { field: string; message: string };

/** Respuesta de error del contrato: `{ code, message, details? }`. */
export const apiError = (
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) =>
  HttpResponse.json(
    { code, message, ...(details ? { details } : {}) },
    { status },
  );

/** `VALIDATION_ERROR` con un error por campo, ordenados por nombre de campo. */
export const validationError = (errors: FieldError[]) =>
  HttpResponse.json(
    {
      code: "VALIDATION_ERROR",
      message: "Revisa los datos enviados",
      errors: [...errors].sort((a, b) => a.field.localeCompare(b.field)),
    },
    { status: 400 },
  );

export const invalidJson = () =>
  apiError(
    400,
    "VALIDATION_ERROR",
    "El cuerpo de la solicitud no es un JSON válido",
  );

export const unauthorized = () =>
  apiError(401, "UNAUTHORIZED", "Tu sesión expiró. Vuelve a iniciar sesión.");

/** Cuerpo JSON como objeto; `{}` si no hay cuerpo y `null` si no es un objeto JSON. */
export async function readBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (!text.trim()) {
    return {};
  }
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export type TokenScope = "REGISTRATION" | "PRE_AUTH" | "SESSION";

// Vigencia en segundos, igual que los valores por defecto del backend: 15 min, 10 min y 8 h.
const TOKEN_TTL: Record<TokenScope, number> = {
  REGISTRATION: 900,
  PRE_AUTH: 600,
  SESSION: 28800,
};

/**
 * Token simulado, sin firma. Lleva el usuario, el alcance y el vencimiento en el propio
 * token para que siga siendo válido después de recargar la página.
 */
export function issueToken(userId: string, scope: TokenScope) {
  const expiresIn = TOKEN_TTL[scope];
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      scope,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    }),
  );
  return { token: `mock.${payload}.token`, scope, expiresIn };
}

/** Usuario del token, o la respuesta 401 / 403 que corresponde. */
export function authenticate(
  request: Request,
  scopes: TokenScope[] = ["SESSION"],
): MockUser | Response {
  const header = request.headers.get("Authorization") ?? "";
  const payload = /^Bearer mock\.([^.]+)\.token$/.exec(header)?.[1];
  if (!payload) {
    return unauthorized();
  }

  let claims: { sub?: string; scope?: TokenScope; exp?: number };
  try {
    claims = JSON.parse(atob(payload));
  } catch {
    return unauthorized();
  }

  if (!claims.exp || claims.exp * 1000 <= Date.now()) {
    return unauthorized();
  }
  if (!claims.scope || !scopes.includes(claims.scope)) {
    return apiError(
      403,
      "FORBIDDEN_SCOPE",
      "No tienes permiso para realizar esta acción",
    );
  }

  const user = db.users.find((item) => item.id === claims.sub);
  if (!user || user.status === "BLOCKED") {
    return unauthorized();
  }
  return user;
}

export const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{24}$/.test(value);

export const isBlank = (value: unknown) =>
  typeof value !== "string" || value.trim() === "";

export const UTP_EMAIL = /^[A-Za-z0-9._%+-]+@utp\.edu\.pe$/i;
export const DNI = /^\d{8}$/;

/** Nombres y apellidos: obligatorios, con al menos una letra y máximo 60 caracteres (RN-05). */
export function checkPersonName(
  value: unknown,
  field: string,
  label: string,
  errors: FieldError[],
) {
  if (isBlank(value)) {
    errors.push({ field, message: `${label} son obligatorios` });
  } else if ((value as string).trim().length > 60 || !/\p{L}/u.test(value as string)) {
    errors.push({
      field,
      message: `${label} deben tener al menos una letra y como máximo 60 caracteres`,
    });
  }
}

/** Foto ya subida con `POST /files`, del usuario y del propósito del formulario. */
export const findOwnFile = (
  fileId: string,
  user: MockUser,
  purpose: "PROFILE_PHOTO" | "VEHICLE_PHOTO",
) =>
  db.files.find(
    (file) =>
      file.id === fileId && file.ownerId === user.id && file.purpose === purpose,
  );
