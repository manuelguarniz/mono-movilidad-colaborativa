import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelectField } from "@/features/auth/components/AuthSelectField";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { ProfilePhotoPicker } from "@/features/auth/components/ProfilePhotoPicker";
import { profileService } from "@/features/profile/services/profileService";
import type { DocumentType, Role, UserProfile } from "@/features/profile/types";
import {
  getUploadErrorMessage,
  resolveFileUrl,
  uploadPhoto,
} from "@/shared/api/fileService";
import { usePhotoSelection } from "@/shared/hooks/usePhotoSelection";
import CapIcon from "@/assets/images/icons/graduation-cap.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import MailIcon from "@/assets/images/icons/mail.svg?react";
import PhoneIcon from "@/assets/images/icons/phone.svg?react";
import SaveIcon from "@/assets/images/icons/save.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

const MODES: Array<{ value: Role; label: string }> = [
  { value: "PASSENGER", label: "Pasajero" },
  { value: "DRIVER", label: "Conductor" },
];

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carné de extranjería" },
];

const PHONE_PREFIX = "+51";
const HAS_LETTER = /\p{L}/u;
const MAX_NAME_LENGTH = 60;

type FormValues = {
  activeMode: Role;
  firstName: string;
  lastName: string;
  // Nueve dígitos, sin el prefijo +51.
  phone: string;
  documentType: string;
  documentNumber: string;
};

const toForm = (profile: UserProfile): FormValues => ({
  activeMode: profile.activeMode,
  firstName: profile.firstName,
  lastName: profile.lastName,
  phone: profile.phone?.replace(PHONE_PREFIX, "") ?? "",
  documentType: profile.documentType ?? "",
  documentNumber: profile.documentNumber ?? "",
});

/** «Actualizar datos» (frame 15, RF-20 y RF-21). */
export function UpdateProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photo = usePhotoSelection();
  const [form, setForm] = useState<FormValues | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const layout = {
    backTo: "/perfil",
    showBrandHeader: true,
    title: "Actualizar Datos",
    subtitle: "Mantén tu información personal al día",
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
  const isDualMode = profile.roles.includes("PASSENGER") && profile.roles.includes("DRIVER");
  const needsVehicle = form.activeMode === "DRIVER" && !profile.vehicle;

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setError("");
    setForm({ ...form, [field]: value });
  };

  const validateName = (value: string, label: string) => {
    const name = value.trim();
    if (!name) {
      return `${label} son obligatorios`;
    }
    if (name.length > MAX_NAME_LENGTH || !HAS_LETTER.test(name)) {
      return `${label} deben tener al menos una letra y como máximo 60 caracteres`;
    }
    return "";
  };

  // Mismas reglas y mensajes que la API.
  const validate = () => {
    const nameError =
      validateName(form.firstName, "Los nombres") ||
      validateName(form.lastName, "Los apellidos");
    if (nameError) {
      return nameError;
    }
    if (!form.phone) {
      return "El teléfono es obligatorio";
    }
    if (!/^\d{9}$/.test(form.phone)) {
      return "El teléfono debe tener el formato +51 seguido de 9 dígitos";
    }
    if (needsVehicle) {
      return "Registra un vehículo para usar la modalidad de conductor";
    }
    if (hasDocument) {
      return "";
    }
    if (!form.documentType) {
      return "El tipo de documento es obligatorio";
    }
    if (!form.documentNumber) {
      return "El número de documento es obligatorio";
    }
    if (form.documentType === "DNI" && !/^\d{8}$/.test(form.documentNumber)) {
      return "El DNI debe tener 8 dígitos";
    }
    if (form.documentType === "CE" && !/^[A-Za-z0-9]{8,12}$/.test(form.documentNumber)) {
      return "El carné de extranjería debe tener entre 8 y 12 letras o números";
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) {
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
        activeMode: form.activeMode,
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
      setError(err instanceof Error ? err.message : "No se pudieron guardar tus datos");
    } finally {
      setIsSubmitting(false);
    }
  };

  const lock = <LockIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />;

  return (
    <AuthStepLayout {...layout}>
      <form onSubmit={handleSubmit}>
        <div className="mb-5 rounded-xl bg-[#f3f3f3] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Modalidad activa
            </p>
            {isDualMode ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-red)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-red)]" />
                Modo dual
              </p>
            ) : null}
          </div>

          <div className="publish-segment mt-2" role="radiogroup" aria-label="Modalidad activa">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={form.activeMode === mode.value}
                className={
                  form.activeMode === mode.value
                    ? "publish-segment-option publish-segment-option-active"
                    : "publish-segment-option"
                }
                onClick={() => update("activeMode", mode.value)}
              >
                {mode.value === "PASSENGER" ? (
                  <CapIcon className="h-5 w-5" />
                ) : (
                  <CarIcon className="h-5 w-5" />
                )}
                {mode.label}
              </button>
            ))}
          </div>

          <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
            Alterna de rol para solicitar viajes compartidos o publicar rutas
            universitarias.
          </p>

          {needsVehicle ? (
            <p className="mt-2 text-center text-sm text-[var(--text-primary)]">
              Para usar la modalidad de conductor necesitas un vehículo.{" "}
              <Link to="/perfil/vehiculo" className="font-semibold text-[var(--brand-red)]">
                Registrar vehículo
              </Link>
            </p>
          ) : null}
        </div>

        <ProfilePhotoPicker
          previewUrl={photo.previewUrl ?? resolveFileUrl(profile.photoUrl)}
          onSelect={photo.select}
          onRemove={photo.file ? photo.clear : undefined}
        />
        <p className="mb-5 mt-1 text-center text-sm text-[var(--text-brown)]">
          Toca la cámara para cambiar tu foto de perfil
        </p>

        <AuthField
          label="Nombres"
          required
          value={form.firstName}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="given-name"
          onChange={(value) => update("firstName", value)}
          icon={<UserIcon className="h-6 w-6" />}
        />

        <AuthField
          label="Apellidos"
          required
          value={form.lastName}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="family-name"
          onChange={(value) => update("lastName", value)}
          icon={<IdCardIcon className="h-6 w-6" />}
        />

        <AuthField
          label="Teléfono / Celular"
          required
          type="tel"
          value={form.phone}
          placeholder="987654321"
          inputMode="numeric"
          maxLength={9}
          autoComplete="tel-national"
          prefix={PHONE_PREFIX}
          onChange={(value) => update("phone", value.replace(/\D/g, ""))}
          icon={<PhoneIcon className="h-6 w-6" />}
        />

        <AuthField
          label="Correo institucional"
          value={profile.email}
          disabled
          onChange={() => undefined}
          icon={<MailIcon className="h-6 w-6" />}
          rightAction={lock}
          helperText="Tu correo universitario no se puede modificar."
        />

        {hasDocument ? (
          <AuthField
            label={`Documento de identidad (${profile.documentType})`}
            value={form.documentNumber}
            disabled
            onChange={() => undefined}
            icon={<IdCardIcon className="h-6 w-6" />}
            rightAction={lock}
            helperText="El documento ya está registrado y no se puede modificar."
          />
        ) : (
          <>
            <AuthSelectField
              label="Tipo de documento"
              value={form.documentType}
              placeholder="Selecciona el tipo"
              options={DOCUMENT_TYPE_OPTIONS}
              onChange={(value) => {
                setError("");
                setForm({ ...form, documentType: value, documentNumber: "" });
              }}
              icon={<IdCardIcon className="h-6 w-6" />}
            />
            <AuthField
              label="Número de documento"
              required
              value={form.documentNumber}
              inputMode={form.documentType === "CE" ? "text" : "numeric"}
              maxLength={form.documentType === "CE" ? 12 : 8}
              onChange={(value) =>
                update(
                  "documentNumber",
                  form.documentType === "CE"
                    ? value.replace(/[^A-Za-z0-9]/g, "")
                    : value.replace(/\D/g, ""),
                )
              }
              icon={<IdCardIcon className="h-6 w-6" />}
              helperText="Se registra una sola vez: después no se puede modificar."
            />
          </>
        )}

        {error || photo.error ? (
          <div className="auth-message auth-message-error" role="alert">
            {error || photo.error}
          </div>
        ) : null}

        <button type="submit" className="auth-button-primary gap-2" disabled={isSubmitting}>
          <SaveIcon className="h-5 w-5" />
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>

        <button
          type="button"
          className="mt-2 w-full py-2 text-center text-[0.9375rem] text-[var(--text-muted)]"
          onClick={() => {
            setForm(toForm(profile));
            setError("");
            photo.clear();
          }}
        >
          Descartar cambios
        </button>
      </form>
    </AuthStepLayout>
  );
}
