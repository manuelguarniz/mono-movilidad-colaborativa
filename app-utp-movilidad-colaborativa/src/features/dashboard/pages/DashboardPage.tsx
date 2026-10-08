import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RideCard } from "@/features/dashboard/components/RideCard";
import { RideSearchBar } from "@/features/dashboard/components/RideSearchBar";
import { dashboardService } from "@/features/dashboard/services/dashboardService";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [reservingRideId, setReservingRideId] = useState<string | null>(null);

  const { data: rides = [], isLoading, isError, error } = useQuery({
    queryKey: ["rides"],
    queryFn: () => dashboardService.getRides(),
  });

  const reserveMutation = useMutation({
    mutationFn: (rideId: string) => dashboardService.reserveRide(rideId),
    onMutate: (rideId) => {
      setReservingRideId(rideId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
    onSettled: () => {
      setReservingRideId(null);
    },
  });

  const handleReserve = (rideId: string) => {
    reserveMutation.mutate(rideId);
  };

  return (
    <div className="dashboard-page">
      <RideSearchBar
        destination="Campus Universidad"
        timeFilter="Hoy, 14:00+"
        passengers={1}
      />

      {isLoading && (
        <p className="py-8 text-center text-sm text-[#7a6d6d]">
          Cargando viajes disponibles...
        </p>
      )}

      {isError && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los viajes:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
      )}

      <div className="space-y-4">
        {rides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            onReserve={handleReserve}
            isReserving={reservingRideId === ride.id}
          />
        ))}
      </div>
    </div>
  );
}
