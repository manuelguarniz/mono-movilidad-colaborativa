import { apiClient } from "@/shared/api/apiClient";
import type {
  CurrentUser,
  RidePage,
  RideSearchFilters,
} from "@/features/dashboard/types";

export const dashboardService = {
  getCurrentUser: () => apiClient.get<unknown, CurrentUser>("/users/me"),

  /** Una página del listado (20 viajes); solo se envían los filtros con valor. */
  getRides: (filters: RideSearchFilters, page: number) =>
    apiClient.get<unknown, RidePage>("/rides", {
      params: {
        destination: filters.destination.trim() || undefined,
        time: filters.time ?? undefined,
        passengers: filters.passengers > 1 ? filters.passengers : undefined,
        accessible: filters.accessible || undefined,
        page,
      },
    }),


  reserveRide: (rideId: string) =>
    apiClient.post<unknown, { message: string }>(`/rides/${rideId}/reserve`),
};
