import { apiClient } from "@/shared/api/apiClient";
import type { MyBookings, MyDriverRides } from "@/features/my-rides/types";

type MessageResponse = { message: string };

export const myRidesService = {
  getMyBookings: () => apiClient.get<unknown, MyBookings>("/bookings/mine"),

  /** El mensaje trae los créditos devueltos: «Reserva cancelada. Te devolvimos 12 créditos.». */
  cancelBooking: (bookingId: string) =>
    apiClient.post<unknown, MessageResponse>(`/bookings/${bookingId}/cancel`),

  getMyDriverRides: () => apiClient.get<unknown, MyDriverRides>("/rides/mine"),

  cancelRide: (rideId: string, reason: string) =>
    apiClient.post<unknown, MessageResponse>(`/rides/${rideId}/cancel`, {
      reason: reason.trim() || null,
    }),

  /** Las reservas que no van en `boardedBookingIds` pasan a «No se presentó» (RN-43). */
  startRide: (rideId: string, boardedBookingIds: string[]) =>
    apiClient.post<unknown, MessageResponse>(`/rides/${rideId}/start`, { boardedBookingIds }),

  finishRide: (rideId: string) =>
    apiClient.post<unknown, MessageResponse>(`/rides/${rideId}/finish`),
};
