import { apiClient } from "@/shared/api/apiClient";
import type {
  Campus,
  MyProfile,
  MyVehicle,
  PublishedRide,
  RideCreateRequest,
  RideDetail,
} from "@/features/rides/types";

export const rideService = {
  /** Responde 404 `VEHICLE_NOT_FOUND` si el usuario no tiene vehículo (RF-18). */
  getMyVehicle: () => apiClient.get<unknown, MyVehicle>("/vehicles/me"),

  getMyProfile: () => apiClient.get<unknown, MyProfile>("/users/me"),

  /** Sede del usuario con su ubicación; las sedes se listan por distrito. */
  getCampus: async (districtId: string, campusId: string) => {
    const response = await apiClient.get<unknown, { data: Campus[] }>(
      "/catalogs/campuses",
      { params: { districtId } },
    );
    return response.data.find((campus) => campus.id === campusId) ?? null;
  },

  /** Responde 404 `RIDE_NOT_FOUND` si el viaje no existe. */
  getRide: (rideId: string) => apiClient.get<unknown, RideDetail>(`/rides/${rideId}`),

  publishRide: (payload: RideCreateRequest) =>
    apiClient.post<unknown, PublishedRide>("/rides", payload),
};
