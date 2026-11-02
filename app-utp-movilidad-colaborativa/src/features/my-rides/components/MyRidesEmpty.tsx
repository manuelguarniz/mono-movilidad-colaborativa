import { Link } from "react-router-dom";
import PlusIcon from "@/assets/images/icons/plus-circle.svg?react";
import SearchIcon from "@/assets/images/icons/search.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";

/** «No tienes viajes próximos» (frame 17-G y su variante del conductor). */
export function MyRidesEmpty({ isDriver }: { isDriver: boolean }) {
  return (
    <section className="ride-card flex flex-col items-center px-6 py-12 text-center">
      <div className="dashboard-empty-icon">
        <CarIcon className="h-9 w-9" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
        No tienes viajes próximos
      </h3>
      <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
        {isDriver
          ? "Cuando publiques un viaje, aparecerá aquí."
          : "Cuando reserves un viaje, aparecerá aquí."}
      </p>
      <Link
        to={isDriver ? "/viajes/publicar" : "/dashboard"}
        className="publish-submit mt-6 gap-2"
      >
        {isDriver ? <PlusIcon className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
        {isDriver ? "Publicar un viaje" : "Buscar un viaje"}
      </Link>
    </section>
  );
}
