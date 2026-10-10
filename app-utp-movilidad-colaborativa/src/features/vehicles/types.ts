// Tipos del contrato `docs/openapi.yaml` para el vehículo del conductor.

export type VehicleType = "SEDAN" | "HATCHBACK" | "SUV" | "VAN" | "MOTORCYCLE";

// `Vehicle`: campo embebido `usuarios.vehiculo`.
export type Vehicle = {
  plate: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  year: number;
  // Plazas que el conductor comparte, sin contar la suya.
  seats: number;
  ownerDni: string | null;
  isOwner: boolean;
  status: "ACTIVE" | "INACTIVE";
  photoUrl: string | null;
  registeredAt: string;
};

type VehicleData = {
  plate: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  year: number;
  seats: number;
  isOwner: boolean;
  acceptedTerms: true;
  photoFileId?: string;
};

// `VehicleCreateRequest` (POST /vehicles).
export type VehicleCreateRequest = VehicleData & { ownerDni: string };

// `VehicleUpdateRequest` (PUT /vehicles/me). El DNI del propietario no se modifica aquí.
export type VehicleUpdateRequest = VehicleData;
