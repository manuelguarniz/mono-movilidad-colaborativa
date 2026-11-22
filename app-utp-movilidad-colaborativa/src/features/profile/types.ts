import type { Vehicle } from "@/features/vehicles/types";

// Tipos del contrato `docs/openapi.yaml` para el perfil del usuario.

export type Role = "PASSENGER" | "DRIVER";
export type DocumentType = "DNI" | "CE";

// `UserProfile` (GET /users/me). Lo que el usuario aún no registra llega como `null`.
export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  photoUrl: string | null;
  department: { id: string; name: string } | null;
  district: { id: string; name: string } | null;
  campus: { id: string; name: string; address: string } | null;
  homeAddress: { label: string; address?: string | null } | null;
  // RN-17: solo en el perfil propio; `null` si no la declaró. Se edita en P15.
  mobilityAssistance: MobilityAssistance | null;
  roles: Role[];
  activeMode: Role;
  status: "PROFILE_PENDING" | "ACTIVE" | "BLOCKED";
  vehicle: Vehicle | null;
  stats: { trips: number; compliance: number; co2SavedKg: number };
  rating: { average: number; count: number } | null;
  createdAt: string;
  // RN-48: viaje `IN_PROGRESS` que conduce (DRIVER) o en el que viaja (PASSENGER); `null` si no hay.
  tripInProgress: TripInProgress | null;
};

export type TripInProgress = {
  rideId: string;
  role: Role;
  origin: string | null;
  destination: string | null;
  startedAt: string | null;
  // Copias del viaje, para que el pasajero vea con quién viaja (13-E).
  driver: { name: string; photoUrl: string | null } | null;
  vehicle: { brand: string; model: string; color: string } | null;
};

export type MobilityAssistanceType = "WHEELCHAIR" | "CRUTCHES_OR_WALKER" | "OTHER";

export type MobilityAssistance = {
  type: MobilityAssistanceType;
  note: string | null;
};

// `MobilityAssistanceRequest` (RN-17): solo se guarda con el consentimiento marcado.
export type MobilityAssistanceRequest = {
  type: MobilityAssistanceType;
  note?: string;
  consent: true;
};

// `UserUpdateRequest` (PUT /users/me). El documento solo se envía mientras el usuario no
// tenga uno registrado; el correo no es editable. La modalidad se cambia en el perfil
// (PATCH /users/me/mode, RN-48). `mobilityAssistance: null` quita la asistencia guardada.
export type UserUpdateRequest = {
  firstName: string;
  lastName: string;
  phone: string;
  activeMode?: Role;
  mobilityAssistance: MobilityAssistanceRequest | null;
  documentType?: DocumentType;
  documentNumber?: string;
  photoFileId?: string;
};
