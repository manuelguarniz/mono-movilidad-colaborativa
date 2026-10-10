import { apiClient } from "@/shared/api/apiClient";
import type {
  Vehicle,
  VehicleCreateRequest,
  VehicleUpdateRequest,
} from "@/features/vehicles/types";

export const vehicleService = {
  /** Responde 404 `VEHICLE_NOT_FOUND` si el usuario no tiene vehículo. */
  getMine: () => apiClient.get<unknown, Vehicle>("/vehicles/me"),

  /**
   * Registra el vehículo y agrega el rol de conductor. `token` es el token REGISTRATION
   * durante el registro; sin él se usa el de la sesión.
   */
  register: (payload: VehicleCreateRequest, token?: string) =>
    apiClient.post<unknown, Vehicle>("/vehicles", payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  /** Actualiza el vehículo; si el usuario aún no tiene uno, lo registra. */
  updateMine: (payload: VehicleUpdateRequest) =>
    apiClient.put<unknown, Vehicle>("/vehicles/me", payload),
};
