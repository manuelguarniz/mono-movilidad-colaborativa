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
  // RN-18: apto para movilidad reducida si `wheelchair` es `true`.
  accessibility: VehicleAccessibility;
  // RN-36: `null` si el conductor todavía no declaró su SOAT.
  soat: Soat | null;
};

export type VehicleAccessibility = { wheelchair: boolean; boardingAssistance: boolean };

// `Soat`: fechas `AAAA-MM-DD` de Perú.
export type Soat = {
  insurer: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  photoUrl: string | null;
  declaredAt: string;
};

// `SoatRequest`. Opcional mientras los formularios de P05 y P16 no lo pidan.
export type SoatRequest = {
  insurer: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  photoFileId?: string;
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
  accessibility?: VehicleAccessibility;
  soat?: SoatRequest;
};

// `VehicleCreateRequest` (POST /vehicles).
export type VehicleCreateRequest = VehicleData & { ownerDni: string };

// `VehicleUpdateRequest` (PUT /vehicles/me). El DNI del propietario no se modifica aquí.
export type VehicleUpdateRequest = VehicleData;
