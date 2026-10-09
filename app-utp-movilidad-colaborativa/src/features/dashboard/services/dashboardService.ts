import { apiClient } from "@/shared/api/apiClient";
import type {
  CurrentUser,
  RideSearchFilters,
  RideSummary,
} from "@/features/dashboard/types";

export const dashboardService = {
  getCurrentUser: () => apiClient.get<unknown, CurrentUser>("/users/me"),
  getRides: async (filters?: RideSearchFilters): Promise<RideSummary[]> => {
    const response = await apiClient.get<unknown, { data: RideSummary[] }>(
      "/rides",
      { params: filters },
    );
    return response.data;
  },
  reserveRide: (rideId: string) =>
    apiClient.post<unknown, { message: string }>(`/rides/${rideId}/reserve`),
};
