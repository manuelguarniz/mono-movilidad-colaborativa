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
  roles: Role[];
  activeMode: Role;
  status: "PROFILE_PENDING" | "ACTIVE" | "BLOCKED";
  vehicle: Vehicle | null;
  stats: { trips: number; compliance: number; co2SavedKg: number };
  rating: { average: number; count: number } | null;
  createdAt: string;
};

// `UserUpdateRequest` (PUT /users/me). El documento solo se envía mientras el usuario no
// tenga uno registrado; el correo no es editable.
export type UserUpdateRequest = {
  firstName: string;
  lastName: string;
  phone: string;
  activeMode: Role;
  documentType?: DocumentType;
  documentNumber?: string;
  photoFileId?: string;
};
