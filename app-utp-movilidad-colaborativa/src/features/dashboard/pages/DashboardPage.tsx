import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RideCard } from "@/features/dashboard/components/RideCard";
import { RideConditionsModal } from "@/features/dashboard/components/RideConditionsModal";
import { RideSearchBar } from "@/features/dashboard/components/RideSearchBar";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import type { RideSummary } from "@/features/dashboard/types";
import { ReserveRideConfirmModal } from "@/features/rides/components/ReserveRideConfirmModal";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const ridePublished = Boolean(
    (location.state as { ridePublished?: boolean } | null)?.ridePublished,
  );
  const [conditionsRide, setConditionsRide] = useState<RideSummary | null>(null);
  // Viaje que espera la confirmación de la reserva.
  const [rideToReserve, setRideToReserve] = useState<RideSummary | null>(null);

  const { data: rides = [], isLoading, isError, error } = useQuery({
    queryKey: ["rides"],
    queryFn: () => dashboardService.getRides(),
  });

  const reserveMutation = useMutation({
    mutationFn: (rideId: string) => dashboardService.reserveRide(rideId),
    onSettled: () => {
      setRideToReserve(null);
      // Con éxito o con error cambian las plazas o el estado del viaje: se refresca el listado.
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });

  const handleReserve = (ride: RideSummary) => {
    reserveMutation.reset();
    setRideToReserve(ride);
  };

  return (
    <div className="dashboard-page">
      <RideSearchBar
        destination="Campus Universidad"
        timeFilter="Hoy, 14:00+"
        passengers={1}
      />

      {/* El listado no incluye los viajes del propio usuario: se avisa aquí. */}
      {ridePublished && !reserveMutation.isSuccess && !reserveMutation.isError && (
        <p className="dashboard-message" role="status">
          Tu viaje fue publicado. Tus compañeros de sede ya pueden reservarlo.
        </p>
      )}

      {reserveMutation.isSuccess && (
        <p className="dashboard-message" role="status">
          Reserva confirmada. Tu asiento en el viaje está separado.
        </p>
      )}

      {reserveMutation.isError && (
        <p className="dashboard-message dashboard-message-error" role="alert">
          {reserveMutation.error instanceof Error
            ? reserveMutation.error.message
            : "No se pudo reservar el viaje"}
        </p>
      )}

      {isLoading && (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          Cargando viajes disponibles...
        </p>
      )}

      {isError && (
        <p className="dashboard-message dashboard-message-error">
          No se pudieron cargar los viajes:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
      )}

      {!isLoading && !isError && rides.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          No hay viajes disponibles en tu sede por ahora.
        </p>
      )}

      <div className="space-y-4">
        {rides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            onOpen={(rideId) => navigate(`/viajes/${rideId}`)}
            onShowConditions={setConditionsRide}
            onReserve={handleReserve}
          />
        ))}
      </div>

      {conditionsRide ? (
        <RideConditionsModal
          conditions={conditionsRide.conditions}
          onClose={() => setConditionsRide(null)}
        />
      ) : null}

      {rideToReserve ? (
        <ReserveRideConfirmModal
          ride={rideToReserve}
          isReserving={reserveMutation.isPending}
          onConfirm={() => reserveMutation.mutate(rideToReserve.id)}
          onCancel={() => setRideToReserve(null)}
        />
      ) : null}
    </div>
  );
}
