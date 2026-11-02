import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DriverDashboard } from "@/features/dashboard/components/DriverDashboard";
import { PassengerDashboard } from "@/features/dashboard/components/PassengerDashboard";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

/**
 * Dashboard (P06). Según el modo activo del perfil: el pasajero busca y reserva (06-A a 06-E);
 * el conductor publica y ve sus viajes publicados (06-F, 06-G).
 */
export function DashboardPage() {
  const location = useLocation();
  const ridePublished = Boolean(
    (location.state as { ridePublished?: boolean } | null)?.ridePublished,
  );

  const userQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: dashboardService.getCurrentUser,
  });
  const user = userQuery.data;
  const isDriver = user?.activeMode === "DRIVER";

  return (
    <div className="dashboard-page">
      <div className="pb-1">
        <p className="publish-label">Viajes</p>
        <h2 className="mt-1 text-[1.75rem] font-semibold leading-tight text-[var(--text-primary)]">
          {isDriver ? "Tus viajes" : "Encuentra tu viaje"}
        </h2>
        {user ? (
          <span className="mode-chip mt-2">
            {isDriver ? <CarIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            {isDriver ? "Modo conductor" : "Modo pasajero"}
          </span>
        ) : null}
      </div>

      {ridePublished ? (
        <p className="dashboard-message" role="status">
          Viaje publicado. Ya aparece en el dashboard de todas las sedes.
        </p>
      ) : null}

      {userQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando...</p>
      ) : isDriver ? (
        <DriverDashboard cancellationBlock={user?.cancellationBlock ?? null} />
      ) : (
        <PassengerDashboard />
      )}
    </div>
  );
}
