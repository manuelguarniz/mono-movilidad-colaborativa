import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelectField } from "@/features/auth/components/AuthSelectField";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { ProfilePhotoPicker } from "@/features/auth/components/ProfilePhotoPicker";
import { DiscardChangesSheet } from "@/features/profile/components/DiscardChangesSheet";
import { MobilityAssistanceCard } from "@/features/profile/components/MobilityAssistanceCard";
import { RemoveAssistanceSheet } from "@/features/profile/components/RemoveAssistanceSheet";
import { profileService } from "@/features/profile/services/profileService";
import type { DocumentType, UserProfile } from "@/features/profile/types";
import {
  EMPTY_ASSISTANCE,
  toAssistanceForm,
  toAssistanceRequest,
  validateAssistance,
  type AssistanceErrors,
  type AssistanceForm,
} from "@/features/profile/utils/assistance";
import { ApiError } from "@/shared/api/apiClient";
import {
  getUploadErrorMessage,
  resolveFileUrl,
  uploadPhoto,
} from "@/shared/api/fileService";
import { usePhotoSelection } from "@/shared/hooks/usePhotoSelection";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import MailIcon from "@/assets/images/icons/mail.svg?react";
import PhoneIcon from "@/assets/images/icons/phone.svg?react";
import SaveIcon from "@/assets/images/icons/save.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "CE" },
];

const PHONE_PREFIX = "+51";
const HAS_LETTER = /\p{L}/u;
const MAX_NAME_LENGTH = 60;

type FormValues = {
  firstName: string;
  lastName: string;
  // Nueve dígitos, sin el prefijo +51.
  phone: string;
  documentType: string;
  documentNumber: string;
  assistance: AssistanceForm;
};

type FieldName = "firstName" | "lastName" | "phone" | "documentType" | "documentNumber";
type Errors = Partial<Record<FieldName, string>> & { assistance?: AssistanceErrors };

const toForm = (profile: UserProfile): FormValues => ({
  firstName: profile.firstName,
  lastName: profile.lastName,
  phone: profile.phone?.replace(PHONE_PREFIX, "") ?? "",
  documentType: profile.documentType ?? "DNI",
  documentNumber: profile.documentNumber ?? "",
  assistance: toAssistanceForm(profile.mobilityAssistance),
});

const sameForm = (a: FormValues, b: FormValues) => JSON.stringify(a) === JSON.stringify(b);

const validateName = (value: string, label: string) => {
  const name = value.trim();
  if (!name) {
    return `${label} son obligatorios`;
  }
  if (name.length > MAX_NAME_LENGTH || !HAS_LETTER.test(name)) {
    return `${label} deben tener al menos una letra y como máximo 60 caracteres`;
  }
  return undefined;
};

/** Mismas reglas y mensajes que la API (tabla «Mensajes de validación» de P15). */
function validate(form: FormValues, hasDocument: boolean): Errors {
  const errors: Errors = {
    firstName: validateName(form.firstName, "Los nombres"),
    lastName: validateName(form.lastName, "Los apellidos"),
  };
  if (!form.phone) {
    errors.phone = "El teléfono es obligatorio";
  } else if (!/^\d{9}$/.test(form.phone)) {
    errors.phone = "El teléfono debe tener el formato +51 seguido de 9 dígitos";
  }
  if (!hasDocument) {
    if (!form.documentType) {
      errors.documentType = "El tipo de documento es obligatorio";
    }
    if (!form.documentNumber) {
      errors.documentNumber = "El número de documento es obligatorio";
    } else if (form.documentType === "DNI" && !/^\d{8}$/.test(form.documentNumber)) {
      errors.documentNumber = "El DNI debe tener 8 dígitos";
    } else if (form.documentType === "CE" && !/^[A-Za-z0-9]{8,12}$/.test(form.documentNumber)) {
      errors.documentNumber = "El carné de extranjería debe tener entre 8 y 12 letras o números";
    }
  }
  const assistance = validateAssistance(form.assistance);
  if (Object.keys(assistance).length > 0) {
    errors.assistance = assistance;
  }
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as Errors;
}

// Los errores de la API llegan con el nombre del campo del contrato.
function toApiErrors(error: ApiError): Errors {
  const errors: Errors = {};
  for (const { field, message } of error.fieldErrors) {
    if (field.startsWith("mobilityAssistance.")) {
      const key = field.split(".")[1] as keyof AssistanceErrors;
      errors.assistance = { ...errors.assistance, [key]: message };
    } else if (["firstName", "lastName", "phone", "documentType", "documentNumber"].includes(field)) {
      errors[field as FieldName] = message;
    }
  }
  return errors;
}

/** «Actualizar datos» (frames 15-A a 15-D; RF-14, RN-14, RN-17). */
export function UpdateProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const photo = usePhotoSelection();
  const [form, setForm] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheet, setSheet] = useState<"remove-assistance" | "discard" | null>(null);
  const scrolledToAssistance = useRef(false);

  const { data: profile, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ["users", "me"],
    queryFn: profileService.getMine,
  });

  // El formulario parte de los datos guardados.
  useEffect(() => {
    if (profile) {
      setForm((current) => current ?? toForm(profile));
    }
  }, [profile]);

  // «Declarar en Actualizar datos» (P13) abre la pantalla en la tarjeta de asistencia.
  useEffect(() => {
    if (form && location.hash === "#asistencia" && !scrolledToAssistance.current) {
      scrolledToAssistance.current = true;
      document.getElementById("asistencia")?.scrollIntoView({ block: "start" });
    }
  }, [form, location.hash]);

  const layout = {
    backTo: "/perfil",
    flowHeader: true,
    title: "Actualizar datos",
    subtitle: "Mantén tu información personal al día.",
  };

  if (isLoading || (profile && !form)) {
    return (
      <AuthStepLayout {...layout}>
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          Cargando tus datos...
        </p>
      </AuthStepLayout>
    );
  }

  if (!profile || !form) {
    return (
      <AuthStepLayout {...layout}>
        <div className="auth-message auth-message-error" role="alert">
          {loadError instanceof Error ? loadError.message : "No se pudo cargar tu perfil"}
        </div>
        <button type="button" className="auth-button-primary" onClick={() => refetch()}>
          Reintentar
        </button>
      </AuthStepLayout>
    );
  }

  // El documento se registra una sola vez: después ya no se puede modificar (RN-14).
  const hasDocument = Boolean(profile.documentNumber);
  const isDirty = Boolean(photo.file) || !sameForm(form, toForm(profile));
  const hadAssistance = Boolean(profile.mobilityAssistance);

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setError("");
    setErrors((current) => ({ ...current, [field]: undefined }));
    setForm({ ...form, [field]: value });
  };

  const leave = () => navigate("/perfil");
  const discard = () => {
    setForm(toForm(profile));
    setErrors({});
    setError("");
    photo.clear();
    setSheet(null);
    leave();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validate(form, hasDocument);
    setErrors(validationErrors);
    setError("");
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      let photoFileId: string | undefined;
      if (photo.file) {
        try {
          photoFileId = (await uploadPhoto(photo.file, "PROFILE_PHOTO")).id;
        } catch (uploadError) {
          setError(getUploadErrorMessage(uploadError));
          return;
        }
      }

      await profileService.updateMine({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: `${PHONE_PREFIX}${form.phone}`,
        mobilityAssistance: toAssistanceRequest(form.assistance),
        ...(hasDocument
          ? {}
          : {
              documentType: form.documentType as DocumentType,
              documentNumber: form.documentNumber,
            }),
        photoFileId,
      });

      // El nombre del conductor también se copia en sus viajes publicados.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users", "me"] }),
        queryClient.invalidateQueries({ queryKey: ["rides"] }),
      ]);
      navigate("/perfil", { replace: true, state: { saved: "profile" } });
    } catch (err) {
      const apiErrors = err instanceof ApiError ? toApiErrors(err) : {};
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
      } else {
        setError(err instanceof Error ? err.message : "No se pudieron guardar tus datos");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const lock = <LockIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />;

  return (
    <AuthStepLayout {...layout} onBack={() => (isDirty ? setSheet("discard") : leave())}>
      <form onSubmit={handleSubmit} noValidate className="form-filled">
        <ProfilePhotoPicker
          previewUrl={photo.previewUrl ?? resolveFileUrl(profile.photoUrl)}
          onSelect={photo.select}
          onRemove={photo.file ? photo.clear : undefined}
        />
        <p className="mb-5 mt-1 text-center text-[0.8125rem] text-[var(--text-muted)]">
          Toca para cambiar tu foto de perfil
        </p>

        <p className="form-section-label">Datos personales</p>

        <AuthField
          label="Nombres"
          value={form.firstName}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="given-name"
          onChange={(value) => update("firstName", value)}
          icon={<UserIcon className="h-6 w-6" />}
          error={errors.firstName}
        />

        <AuthField
          label="Apellidos"
          value={form.lastName}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="family-name"
          onChange={(value) => update("lastName", value)}
          icon={<IdCardIcon className="h-6 w-6" />}
          error={errors.lastName}
        />

        <AuthField
          label="Teléfono"
          type="tel"
          value={form.phone}
          placeholder="987654321"
          inputMode="numeric"
          maxLength={9}
          autoComplete="tel-national"
          prefix={PHONE_PREFIX}
          onChange={(value) => update("phone", value.replace(/\D/g, ""))}
          icon={<PhoneIcon className="h-6 w-6" />}
          error={errors.phone}
        />

        <AuthField
          label="Correo institucional"
          value={profile.email}
          disabled
          onChange={() => undefined}
          icon={<MailIcon className="h-6 w-6" />}
          rightAction={lock}
          helperText="El correo institucional no se puede cambiar."
        />

        {hasDocument ? (
          <AuthField
            label="Documento de identidad"
            value={`${profile.documentType ?? ""} · ${profile.documentNumber}`}
            disabled
            onChange={() => undefined}
            icon={<IdCardIcon className="h-6 w-6" />}
            rightAction={lock}
            helperText="Se registró una sola vez y no se puede modificar."
          />
        ) : (
          <div className="mb-5">
            <p className="auth-label mb-2 block">Documento de identidad</p>
            <div className="grid grid-cols-[7.5rem_1fr] gap-3 [&>*]:mb-0">
              <AuthSelectField
                label="Tipo"
                value={form.documentType}
                placeholder="Tipo"
                options={DOCUMENT_TYPE_OPTIONS}
                onChange={(value) => {
                  setErrors((current) => ({
                    ...current,
                    documentType: undefined,
                    documentNumber: undefined,
                  }));
                  setForm({ ...form, documentType: value, documentNumber: "" });
                }}
                error={errors.documentType}
              />
              <AuthField
                label="Número"
                value={form.documentNumber}
                inputMode={form.documentType === "CE" ? "text" : "numeric"}
                maxLength={form.documentType === "CE" ? 12 : 8}
                onChange={(value) =>
                  update(
                    "documentNumber",
                    form.documentType === "CE"
                      ? value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                      : value.replace(/\D/g, ""),
                  )
                }
                error={errors.documentNumber}
              />
            </div>
            <p className="amber-strip mt-3">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Revisa bien: solo podrás ingresarlo una vez.
            </p>
          </div>
        )}

        <MobilityAssistanceCard
          variant="update"
          value={form.assistance}
          errors={errors.assistance ?? {}}
          onChange={(assistance) => {
            setErrors((current) => ({ ...current, assistance: undefined }));
            setForm({ ...form, assistance });
          }}
          onDisable={() => {
            // Sin asistencia guardada no hay nada que confirmar (15-D).
            if (hadAssistance) {
              setSheet("remove-assistance");
            } else {
              update("assistance", EMPTY_ASSISTANCE);
            }
          }}
        />

        {error || photo.error ? (
          <div className="dashboard-alert mb-4" role="alert">
            <p>{error || photo.error}</p>
          </div>
        ) : null}

        <button type="submit" className="auth-button-primary gap-2" disabled={isSubmitting}>
          <SaveIcon className="h-5 w-5" />
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          type="button"
          className="mt-2 w-full py-2 text-center text-[0.9375rem] text-[var(--text-muted)]"
          onClick={() => (isDirty ? setSheet("discard") : leave())}
        >
          Descartar cambios
        </button>
      </form>

      {sheet === "remove-assistance" ? (
        <RemoveAssistanceSheet
          onConfirm={() => {
            update("assistance", EMPTY_ASSISTANCE);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === "discard" ? (
        <DiscardChangesSheet onDiscard={discard} onClose={() => setSheet(null)} />
      ) : null}
    </AuthStepLayout>
  );
}
