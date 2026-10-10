import type { Vehicle, VehicleType } from "@/features/vehicles/types";

export const VEHICLE_TYPE_OPTIONS: Array<{ value: VehicleType; label: string }> = [
  { value: "SEDAN", label: "Automóvil / Sedán" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "SUV", label: "SUV / Camioneta" },
  { value: "VAN", label: "Van / Minivan" },
  { value: "MOTORCYCLE", label: "Motocicleta" },
];

// RN-08 y RN-09.
const MIN_YEAR = 2000;
const MIN_SEATS = 1;
const MAX_SEATS = 10;

export const SEAT_OPTIONS = Array.from({ length: MAX_SEATS }, (_, index) => {
  const seats = index + MIN_SEATS;
  return {
    value: String(seats),
    label: `${seats} ${seats === 1 ? "asiento" : "asientos"}`,
  };
});

// Los campos del formulario son texto; se convierten al armar la solicitud.
export type VehicleFormValues = {
  plate: string;
  type: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  seats: string;
};

export const EMPTY_VEHICLE_FORM: VehicleFormValues = {
  plate: "",
  type: "",
  brand: "",
  model: "",
  color: "",
  year: "",
  seats: "",
};

export const toVehicleForm = (vehicle: Vehicle): VehicleFormValues => ({
  plate: vehicle.plate,
  type: vehicle.type,
  brand: vehicle.brand,
  model: vehicle.model,
  color: vehicle.color,
  year: String(vehicle.year),
  seats: String(vehicle.seats),
});

// Formato de placa del Perú (RN-07): tres caracteres, guion opcional y tres o cuatro más.
const PLATE = /^[A-Za-z0-9]{3}-?[A-Za-z0-9]{3,4}$/;
export const DNI = /^\d{8}$/;

/** Primer error del formulario, con los mismos mensajes de la API, o `""` si es válido. */
export function validateVehicleForm(values: VehicleFormValues) {
  const plate = values.plate.trim();
  if (!plate) {
    return "La placa es obligatoria";
  }
  if (!PLATE.test(plate)) {
    return "La placa debe tener el formato ABC-123";
  }
  if (!values.type) {
    return "El tipo de vehículo es obligatorio";
  }
  if (!values.brand.trim()) {
    return "La marca es obligatoria";
  }
  if (!values.model.trim()) {
    return "El modelo es obligatorio";
  }
  if (!values.color.trim()) {
    return "El color es obligatorio";
  }
  if (!values.year) {
    return "El año de fabricación es obligatorio";
  }
  const year = Number(values.year);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > new Date().getFullYear()) {
    return "El año de fabricación debe estar entre 2000 y el año actual";
  }
  if (!values.seats) {
    return "Las plazas son obligatorias";
  }
  const seats = Number(values.seats);
  if (!Number.isInteger(seats) || seats < MIN_SEATS || seats > MAX_SEATS) {
    return "Las plazas deben estar entre 1 y 10";
  }
  return "";
}

export const toVehicleData = (values: VehicleFormValues) => ({
  plate: values.plate.trim().toUpperCase(),
  type: values.type as VehicleType,
  brand: values.brand.trim(),
  model: values.model.trim(),
  color: values.color.trim(),
  year: Number(values.year),
  seats: Number(values.seats),
});
