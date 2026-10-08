export type RideOffer = {
  id: string;
  price: number;
  vehicle: string;
  availableSeats: number;
  luggageAvailable: boolean;
  driver: {
    name: string;
    rating: number;
    reviewCount: number;
  };
  departure: {
    window: string;
  };
};

export type RideSearchFilters = {
  destination?: string;
  time?: string;
  passengers?: number;
};
