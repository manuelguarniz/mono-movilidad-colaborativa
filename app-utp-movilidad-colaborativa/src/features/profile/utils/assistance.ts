import type {
  MobilityAssistance,
  MobilityAssistanceRequest,
  MobilityAssistanceType,
} from "@/features/profile/types";

export const ASSISTANCE_LABELS: Record<MobilityAssistanceType, string> = {
  WHEELCHAIR: "Silla de ruedas",
  CRUTCHES_OR_WALKER: "Muletas o andador",
  OTHER: "Otra",
};

export const ASSISTANCE_TYPES: MobilityAssistanceType[] = [
  "WHEELCHAIR",
  "CRUTCHES_OR_WALKER",
  "OTHER",
];

// RN-17.
export const MAX_ASSISTANCE_NOTE = 120;

// Tarjeta «Asistencia de movilidad» de P04 y P15.
export type AssistanceForm = {
  enabled: boolean;
  type: MobilityAssistanceType | "";
  note: string;
  consent: boolean;
};

export type AssistanceErrors = Partial<Record<"type" | "note" | "consent", string>>;

export const EMPTY_ASSISTANCE: AssistanceForm = {
  enabled: false,
  type: "",
  note: "",
  consent: false,
};

// Una asistencia guardada ya tiene el consentimiento: el check aparece marcado.
export const toAssistanceForm = (assistance: MobilityAssistance | null): AssistanceForm =>
  assistance
    ? { enabled: true, type: assistance.type, note: assistance.note ?? "", consent: true }
    : EMPTY_ASSISTANCE;

/** Mismas reglas y mensajes que la API. Con la sección apagada no hay nada que validar. */
export function validateAssistance(form: AssistanceForm): AssistanceErrors {
  if (!form.enabled) {
    return {};
  }
  const errors: AssistanceErrors = {};
  if (!form.type) {
    errors.type = "Elige el tipo de asistencia";
  }
  if (form.note.trim().length > MAX_ASSISTANCE_NOTE) {
    errors.note = "La nota debe tener como máximo 120 caracteres";
  }
  if (!form.consent) {
    errors.consent =
      "Para guardar tu asistencia debes autorizar compartirla, o apaga la opción.";
  }
  return errors;
}

/** `null` si la sección está apagada (en P15 eso quita la asistencia guardada). */
export function toAssistanceRequest(form: AssistanceForm): MobilityAssistanceRequest | null {
  if (!form.enabled || !form.type) {
    return null;
  }
  const note = form.note.trim();
  return { type: form.type, ...(note ? { note } : {}), consent: true };
}
