import { ApiError } from "@/shared/api/apiClient";
import type { SoatErrors } from "@/features/vehicles/utils/soatForm";
import type { VehicleFieldErrors, VehicleFormValues } from "@/features/vehicles/utils/vehicleForm";

const VEHICLE_FIELDS: Array<keyof VehicleFormValues> = [
  "plate",
  "type",
  "brand",
  "model",
  "color",
  "year",
  "seats",
];
const SOAT_FIELDS: Array<keyof SoatErrors> = ["insurer", "policyNumber", "startDate", "endDate"];

export type VehicleApiErrors = {
  fields: VehicleFieldErrors;
  soat: SoatErrors;
  // Lo que no tiene campo: va en la franja sobre los botones.
  general: string;
};

/**
 * Errores de `POST /vehicles` y `PUT /vehicles/me` en su lugar (ajuste 4 de P16): la placa
 * repetida en su campo, `SOAT_NOT_VALID` en la franja del SOAT y el resto sobre los botones.
 */
export function toVehicleApiErrors(error: unknown): VehicleApiErrors {
  const result: VehicleApiErrors = { fields: {}, soat: {}, general: "" };
  if (!(error instanceof ApiError)) {
    result.general = error instanceof Error ? error.message : "No se pudo guardar el vehículo";
    return result;
  }
  if (error.code === "PLATE_ALREADY_REGISTERED") {
    result.fields.plate = error.message;
    return result;
  }
  if (error.code === "SOAT_NOT_VALID") {
    result.soat.validity = error.message;
    return result;
  }
  for (const { field, message } of error.fieldErrors) {
    const soatField = field.startsWith("soat.") ? field.slice(5) : null;
    if (soatField && SOAT_FIELDS.includes(soatField as keyof SoatErrors)) {
      result.soat[soatField as keyof SoatErrors] = message;
    } else if (field === "soat.photoFileId") {
      result.soat.photo = message;
    } else if (VEHICLE_FIELDS.includes(field as keyof VehicleFormValues)) {
      result.fields[field as keyof VehicleFormValues] = message;
    } else if (!result.general) {
      result.general = message;
    }
  }
  if (error.fieldErrors.length === 0) {
    result.general = error.message;
  }
  return result;
}
