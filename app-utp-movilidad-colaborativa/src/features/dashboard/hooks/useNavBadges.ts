import { useQuery } from "@tanstack/react-query";
import { historyService } from "@/features/history/services/historyService";
import type { HistoryRole } from "@/features/history/types";
import { myRidesService } from "@/features/my-rides/services/myRidesService";
import { profileService } from "@/features/profile/services/profileService";
import { getSoatState } from "@/features/profile/utils/soat";

const STALE_MS = 60_000;

/**
 * Calificaciones abiertas (RF-10, 24 h) en la primera página del historial de un rol. Basta
 * con ella: el historial va del más reciente al más antiguo y el plazo es de un día.
 */
function usePendingRatings(role: HistoryRole, enabled: boolean) {
  const query = useQuery({
    queryKey: ["history", role, "pending-ratings"],
    queryFn: () => historyService.getHistory(role, 1),
    enabled,
    staleTime: STALE_MS,
  });
  return (
    query.data?.data.reduce(
      (total, entry) => total + (entry.rating?.open ? entry.rating.pending : 0),
      0,
    ) ?? 0
  );
}

/**
 * Indicadores del menú inferior. Reusan las mismas consultas que Mis viajes, el perfil y el
 * historial, así que se actualizan cuando esas pantallas invalidan su caché.
 * - `myRides`: reserva activa (pasajero) o viajes publicados o en curso (conductor).
 * - `profile`: calificaciones por hacer o SOAT por vencer o vencido (RF-14).
 */
export function useNavBadges() {
  const { data: profile } = useQuery({
    queryKey: ["users", "me"],
    queryFn: profileService.getMine,
  });
  const isDriver = profile?.activeMode === "DRIVER";
  const hasDriverRole = profile?.roles?.includes("DRIVER") ?? false;

  const bookingsQuery = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: myRidesService.getMyBookings,
    enabled: profile != null && !isDriver,
    staleTime: STALE_MS,
  });
  const driverRidesQuery = useQuery({
    queryKey: ["rides", "mine"],
    queryFn: myRidesService.getMyDriverRides,
    enabled: profile != null && isDriver,
    staleTime: STALE_MS,
  });

  const pendingAsPassenger = usePendingRatings("PASSENGER", profile != null);
  const pendingAsDriver = usePendingRatings("DRIVER", hasDriverRole);
  const pendingRatings = pendingAsPassenger + pendingAsDriver;

  const soat = profile?.vehicle?.soat ?? null;
  const soatNeedsAction =
    isDriver && soat != null && getSoatState(soat).kind !== "valid";

  const myRides = isDriver
    ? (driverRidesQuery.data?.data.length ?? 0) > 0
    : bookingsQuery.data?.active != null;

  return {
    isDriver,
    myRides,
    pendingRatings,
    profile: pendingRatings > 0 || soatNeedsAction,
    soatNeedsAction,
  };
}
