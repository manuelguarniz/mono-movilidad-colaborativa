import ClockIcon from "@/assets/images/icons/clock.svg?react";
import PassengerIcon from "@/assets/images/icons/passenger.svg?react";
import PlusCircleIcon from "@/assets/images/icons/plus-circle.svg?react";
import TuneIcon from "@/assets/images/icons/tune.svg?react";

type RideSearchBarProps = {
  destination: string;
  timeFilter: string;
  passengers: number;
};

export function RideSearchBar({
  destination,
  timeFilter,
  passengers,
}: RideSearchBarProps) {
  return (
    <section className="ride-search-card">
      <div className="ride-destination-field">
        <span className="ride-destination-dot" aria-hidden="true" />
        <span className="ride-destination-text">{destination}</span>
      </div>

      <div className="ride-filter-row">
        <button type="button" className="ride-filter-chip ride-filter-chip-active">
          <ClockIcon className="h-4 w-4" />
          {timeFilter}
        </button>

        <button type="button" className="ride-filter-chip">
          <PassengerIcon className="h-4 w-4" />
          {passengers} {passengers === 1 ? "Pasajero" : "Pasajeros"}
        </button>

        <button type="button" className="ride-filter-chip">
          Filtros
          <TuneIcon className="h-4 w-4" />
        </button>
      </div>

      {/* La pantalla «Publicar viaje» todavía no está implementada. */}
      <button type="button" className="ride-publish-button">
        <PlusCircleIcon className="h-5 w-5" />
        Publicar un viaje
      </button>
    </section>
  );
}
