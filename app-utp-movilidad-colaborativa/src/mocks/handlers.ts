import { authHandlers } from "@/mocks/handlers/auth";
import { catalogHandlers } from "@/mocks/handlers/catalogs";
import { fileHandlers } from "@/mocks/handlers/files";
import { historyHandlers } from "@/mocks/handlers/history";
import { ratingHandlers } from "@/mocks/handlers/ratings";
import { rideHandlers } from "@/mocks/handlers/rides";
import { userHandlers } from "@/mocks/handlers/users";
import { vehicleHandlers } from "@/mocks/handlers/vehicles";
import { walletHandlers } from "@/mocks/handlers/wallet";

// API simulada con el contrato `docs/openapi.yaml`: un archivo por módulo en `handlers/`.
export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...fileHandlers,
  ...vehicleHandlers,
  ...rideHandlers,
  ...userHandlers,
  ...walletHandlers,
  ...historyHandlers,
  ...ratingHandlers,
];
