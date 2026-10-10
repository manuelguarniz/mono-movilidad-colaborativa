import { apiClient } from "@/shared/api/apiClient";
import type { UserProfile, UserUpdateRequest } from "@/features/profile/types";

export const profileService = {
  /** Perfil completo en una sola respuesta, con el vehículo si el usuario es conductor. */
  getMine: () => apiClient.get<unknown, UserProfile>("/users/me"),

  updateMine: (payload: UserUpdateRequest) =>
    apiClient.put<unknown, UserProfile>("/users/me", payload),
};
