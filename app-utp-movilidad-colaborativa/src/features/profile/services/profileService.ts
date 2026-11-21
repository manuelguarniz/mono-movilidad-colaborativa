import { apiClient } from "@/shared/api/apiClient";
import type { Role, UserProfile, UserUpdateRequest } from "@/features/profile/types";

export const profileService = {
  /** Perfil completo en una sola respuesta, con el vehículo si el usuario es conductor. */
  getMine: () => apiClient.get<unknown, UserProfile>("/users/me"),

  updateMine: (payload: UserUpdateRequest) =>
    apiClient.put<unknown, UserProfile>("/users/me", payload),

  /** Cambio de modo confirmado en el modal del perfil (RN-48): `TRIP_IN_PROGRESS` o `VEHICLE_REQUIRED`. */
  changeMode: (activeMode: Role) =>
    apiClient.patch<unknown, UserProfile>("/users/me/mode", { activeMode }),
};
