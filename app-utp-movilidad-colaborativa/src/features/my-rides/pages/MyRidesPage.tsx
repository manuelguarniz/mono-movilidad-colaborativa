import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { DriverMyRides } from "@/features/my-rides/components/DriverMyRides";
import { PassengerMyRides } from "@/features/my-rides/components/PassengerMyRides";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

const TOAST_MS = 3000;

/**
 * Mis viajes (P17). Según el modo activo del perfil: la reserva del pasajero (17-A, 17-H) o
 * los viajes del conductor (17-B). El modo solo se indica; se cambia desde el perfil (RN-48).
 */
export function MyRidesPage() {
  const [toast, setToast] = useState<string | null>(null);
  const userQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: dashboardService.getCurrentUser,
  });
  const user = userQuery.data;
  const isDriver = user?.activeMode === "DRIVER";

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className={`dashboard-page ${isDriver ? "pb-20" : ""}`}>
      <div className="flex items-end justify-between gap-3 pb-1">
        <div>
          <p className="publish-label">Viajes</p>
          <h2 className="mt-1 text-[1.75rem] font-semibold leading-tight text-[var(--text-primary)]">
            Mis viajes
          </h2>
        </div>
        {user ? (
          <span
            className={`mode-chip ${isDriver ? "bg-[var(--brand-soft)] text-[var(--brand-red)]" : ""}`}
          >
            {isDriver ? <CarIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            {isDriver ? "Modo conductor" : "Modo pasajero"}
          </span>
        ) : null}
      </div>

      {userQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando...</p>
      ) : isDriver ? (
        <DriverMyRides onToast={setToast} />
      ) : (
        <PassengerMyRides onToast={setToast} />
      )}

      {toast ? (
        <p className="app-toast" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
