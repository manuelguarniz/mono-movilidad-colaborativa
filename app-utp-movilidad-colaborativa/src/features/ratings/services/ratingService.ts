import { apiClient } from "@/shared/api/apiClient";
import type { Rating, RatingContext } from "@/features/ratings/types";

export const ratingService = {
  getContext: (rideId: string) => apiClient.get<unknown, RatingContext>(`/ratings/rides/${rideId}`),

  /** Una calificación por petición (secuencia 8.4): 1 a 5 estrellas y comentario opcional. */
  rate: (bookingId: string, score: number, comment: string) =>
    apiClient.post<unknown, Rating>("/ratings", {
      bookingId,
      score,
      comment: comment.trim() || null,
    }),
};
