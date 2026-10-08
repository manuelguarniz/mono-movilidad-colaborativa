import { apiClient } from "@/shared/api/apiClient";
import type { RideOffer, RideSearchFilters } from "@/features/dashboard/types";

export const dashboardService = {
  getRides: async (filters?: RideSearchFilters): Promise<RideOffer[]> => {
    const response = await apiClient.get<{ data: RideOffer[] }>("/rides", {
      params: filters,
    });
    return response.data;
  },
  reserveRide: (rideId: string) =>
    apiClient.post<{ message: string }>(`/rides/${rideId}/reserve`),
};
