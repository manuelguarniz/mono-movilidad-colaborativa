import { limaToday } from "@/features/profile/utils/soat";
import type { Soat, SoatRequest } from "@/features/vehicles/types";

// Lista fija de la sección 5.1 (`vehiculo.soat.aseguradora`); «Otra» pide el nombre.
export const INSURERS = [
  "Rímac Seguros",
  "Pacífico Seguros",
  "La Positiva",
  "Mapfre",
  "Interseguro",
  "Protecta",
];
export const OTHER_INSURER = "OTHER";

export const INSURER_OPTIONS = [
  ...INSURERS.map((insurer) => ({ value: insurer, label: insurer })),
  { value: OTHER_INSURER, label: "Otra" },
];

// RN-36.
const POLICY = /^[A-Za-z0-9-]{6,20}$/;
const MAX_SOAT_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

// Fechas `AAAA-MM-DD`, como las da `<input type="date">` y como las espera la API.
export type SoatForm = {
  insurer: string;
  otherInsurer: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
};

export type SoatErrors = Partial<
  Record<"insurer" | "policyNumber" | "startDate" | "endDate" | "photo" | "validity", string>
>;

export const EMPTY_SOAT_FORM: SoatForm = {
  insurer: "",
  otherInsurer: "",
  policyNumber: "",
  startDate: "",
  endDate: "",
};

export const toSoatForm = (soat: Soat | null): SoatForm => {
  if (!soat) {
    return EMPTY_SOAT_FORM;
  }
  const known = INSURERS.includes(soat.insurer);
  return {
    insurer: known ? soat.insurer : OTHER_INSURER,
    otherInsurer: known ? "" : soat.insurer,
    policyNumber: soat.policyNumber,
    startDate: soat.startDate,
    endDate: soat.endDate,
  };
};

const insurerName = (form: SoatForm) =>
  (form.insurer === OTHER_INSURER ? form.otherInsurer : form.insurer).trim();

const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

/**
 * Mismas reglas y mensajes que la API (tabla «Mensajes de validación» de P16). `validity` es la
 * franja «Tu SOAT no está vigente…» de 16-B. La foto del certificado es obligatoria (RN-36):
 * `hasPhoto` dice si hay una nueva o una ya guardada.
 */
export function validateSoat(form: SoatForm, hasPhoto: boolean, today = limaToday()): SoatErrors {
  const errors: SoatErrors = {};
  const insurer = insurerName(form);
  if (!insurer) {
    errors.insurer = "La aseguradora es obligatoria";
  } else if (insurer.length > 60) {
    errors.insurer = "La aseguradora debe tener como máximo 60 caracteres";
  }
  const policy = form.policyNumber.trim();
  if (!policy) {
    errors.policyNumber = "El número de póliza es obligatorio";
  } else if (!POLICY.test(policy)) {
    errors.policyNumber = "El número de póliza debe tener de 6 a 20 letras, números o guiones";
  }
  if (!form.startDate) {
    errors.startDate = "La fecha de inicio del SOAT es obligatoria";
  }
  if (!form.endDate) {
    errors.endDate = "La fecha de fin del SOAT es obligatoria";
  }
  if (form.startDate && form.endDate) {
    if (form.endDate < form.startDate) {
      errors.endDate = "La fecha de fin debe ser posterior a la de inicio";
    } else if (days(form.startDate, form.endDate) + 1 > MAX_SOAT_DAYS) {
      errors.endDate = "La vigencia del SOAT no puede superar los 366 días";
    } else if (today < form.startDate || today > form.endDate) {
      errors.validity =
        "Tu SOAT no está vigente. No puedes registrar el vehículo sin un SOAT vigente.";
    }
  }
  if (!hasPhoto) {
    errors.photo = "La foto del SOAT es obligatoria";
  }
  return errors;
}

export const toSoatRequest = (form: SoatForm, photoFileId?: string): SoatRequest => ({
  insurer: insurerName(form),
  policyNumber: form.policyNumber.trim().toUpperCase(),
  startDate: form.startDate,
  endDate: form.endDate,
  ...(photoFileId ? { photoFileId } : {}),
});
