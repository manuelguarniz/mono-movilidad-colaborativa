import { ApiError, apiClient } from "@/shared/api/apiClient";
import { API_BASE_URL } from "@/shared/config/env";

export type FilePurpose = "PROFILE_PHOTO" | "VEHICLE_PHOTO";

type UploadedFile = { id: string; url: string };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png"];

/** Tipos que admite `POST /files`, para el atributo `accept` del selector. */
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",");

/** Mensaje de error si la imagen no cumple el contrato (JPG o PNG de hasta 5 MB), o `""`. */
export function validatePhoto(file: File) {
  if (!PHOTO_TYPES.includes(file.type)) {
    return "Solo se admiten imágenes JPG o PNG";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "La imagen no puede superar los 5 MB";
  }
  return "";
}

/**
 * Sube una foto con `POST /files` y devuelve su `id`, que luego se envía como
 * `photoFileId` en el formulario de perfil o de vehículo. `token` es el token
 * REGISTRATION durante el registro; sin él se usa el de la sesión.
 */
export function uploadPhoto(file: File, purpose: FilePurpose, token?: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);

  return apiClient.post<unknown, UploadedFile>("/files", form, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * El backend todavía no implementa `POST /files`, así que la foto es opcional en todos
 * los formularios: si la carga falla, se puede guardar sin ella.
 */
export const getUploadErrorMessage = (error: unknown) =>
  `No se pudo subir la foto${
    error instanceof ApiError && error.status ? ` (${error.message})` : ""
  }. Quita la foto para guardar sin ella.`;

/** `photoUrl` es una ruta del backend (`/uploads/...`): se completa con su origen. */
export function resolveFileUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }
  return /^(https?:|blob:|data:)/.test(url)
    ? url
    : new URL(url, new URL(API_BASE_URL).origin).toString();
}
