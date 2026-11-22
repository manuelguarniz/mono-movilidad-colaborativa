import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { FieldError } from "@/features/auth/components/FieldError";
import { DiscardChangesSheet } from "@/features/profile/components/DiscardChangesSheet";
import { profileService } from "@/features/profile/services/profileService";
import { formatSoatDayMonth, getSoatState } from "@/features/profile/utils/soat";
import { SoatCard } from "@/features/vehicles/components/SoatCard";
import { VehicleAccessibilityCard } from "@/features/vehicles/components/VehicleAccessibilityCard";
import { VehicleFields } from "@/features/vehicles/components/VehicleFields";
import { VehiclePhotoPicker } from "@/features/vehicles/components/VehiclePhotoPicker";
import { vehicleService } from "@/features/vehicles/services/vehicleService";
import type { Vehicle, VehicleAccessibility } from "@/features/vehicles/types";
import {
  toSoatForm,
  toSoatRequest,
  validateSoat,
  type SoatErrors,
  type SoatForm,
} from "@/features/vehicles/utils/soatForm";
import { toVehicleApiErrors } from "@/features/vehicles/utils/vehicleApiErrors";
import {
  EMPTY_VEHICLE_FORM,
  toVehicleData,
  toVehicleForm,
  validateVehicleForm,
  type VehicleFieldErrors,
  type VehicleFormValues,
} from "@/features/vehicles/utils/vehicleForm";
import { ApiError } from "@/shared/api/apiClient";
import {
  getUploadErrorMessage,
  resolveFileUrl,
  uploadPhoto,
} from "@/shared/api/fileService";
import { usePhotoSelection } from "@/shared/hooks/usePhotoSelection";
import CheckCircleIcon from "@/assets/images/icons/check-circle.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import SaveIcon from "@/assets/images/icons/save.svg?react";
import WarningIcon from "@/assets/images/icons/warning.svg?react";

const isNotFound = (error: unknown) =>
  error instanceof ApiError && error.status === 404;

const NO_ACCESSIBILITY: VehicleAccessibility = { wheelchair: false, boardingAssistance: false };

type FormState = {
  vehicle: VehicleFormValues;
  accessibility: VehicleAccessibility;
  soat: SoatForm;
  isOwner: boolean;
  acceptedTerms: boolean;
};

const toFormState = (vehicle: Vehicle | undefined): FormState => ({
  vehicle: vehicle ? toVehicleForm(vehicle) : EMPTY_VEHICLE_FORM,
  accessibility: vehicle?.accessibility ?? NO_ACCESSIBILITY,
  soat: toSoatForm(vehicle?.soat ?? null),
  isOwner: vehicle?.isOwner ?? false,
  acceptedTerms: false,
});

type Errors = {
  fields: VehicleFieldErrors;
  soat: SoatErrors;
  photo?: string;
  terms?: string;
};

const NO_ERRORS: Errors = { fields: {}, soat: {} };

/**
 * «Actualizar vehículo y SOAT» (frames 16-A a 16-D). Si el usuario todavía no tiene vehículo,
 * la misma pantalla lo registra: `PUT /vehicles/me` lo crea y le agrega el rol de conductor.
 */
export function UpdateVehiclePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // «Publicar viaje» abre esta pantalla y espera volver a su formulario.
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ?? "/perfil";
  const queryClient = useQueryClient();
  const photo = usePhotoSelection();
  const soatPhoto = usePhotoSelection();
  const [form, setForm] = useState<FormState>(() => toFormState(undefined));
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const vehicleQuery = useQuery({
    queryKey: ["vehicles", "me"],
    queryFn: vehicleService.getMine,
    retry: (failureCount, queryError) => !isNotFound(queryError) && failureCount < 1,
  });

  const vehicle = vehicleQuery.data;
  const isNew = isNotFound(vehicleQuery.error);

  // El formulario parte de los datos guardados.
  useEffect(() => {
    if (vehicle) {
      setForm(toFormState(vehicle));
    }
  }, [vehicle]);

  const isMoto = form.vehicle.type === "MOTORCYCLE";
  const hasVehiclePhoto = Boolean(photo.file) || Boolean(vehicle?.photoUrl);
  const hasSoatPhoto = Boolean(soatPhoto.file) || Boolean(vehicle?.soat?.photoUrl);
  const isDirty =
    Boolean(photo.file) ||
    Boolean(soatPhoto.file) ||
    JSON.stringify(form) !== JSON.stringify(toFormState(vehicle));
  const savedSoatState = vehicle?.soat ? getSoatState(vehicle.soat) : null;

  const leave = () => navigate(returnTo);

  const patch = (next: Partial<FormState>) => {
    setError("");
    setForm((current) => ({ ...current, ...next }));
  };

  // RN-15, RN-16, RN-36: mismos mensajes que la API.
  const validate = (): Errors => ({
    fields: validateVehicleForm(form.vehicle),
    soat: validateSoat(form.soat, hasSoatPhoto),
    photo: hasVehiclePhoto ? undefined : "La foto del vehículo es obligatoria",
    terms: form.acceptedTerms ? undefined : "Debes aceptar los términos y condiciones",
  });

  const hasErrors = (next: Errors) =>
    Object.keys(next.fields).length > 0 ||
    Object.keys(next.soat).length > 0 ||
    Boolean(next.photo) ||
    Boolean(next.terms);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setError("");
    if (hasErrors(validationErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      let photoFileId: string | undefined;
      let soatPhotoFileId: string | undefined;
      try {
        if (photo.file) {
          photoFileId = (await uploadPhoto(photo.file, "VEHICLE_PHOTO")).id;
        }
        if (soatPhoto.file) {
          soatPhotoFileId = (await uploadPhoto(soatPhoto.file, "SOAT_PHOTO")).id;
        }
      } catch (uploadError) {
        setError(getUploadErrorMessage(uploadError));
        return;
      }

      await vehicleService.updateMine({
        ...toVehicleData(form.vehicle),
        isOwner: form.isOwner,
        acceptedTerms: true,
        photoFileId,
        // RN-18: una moto no declara accesibilidad (16-C).
        accessibility: isMoto ? NO_ACCESSIBILITY : form.accessibility,
        soat: toSoatRequest(form.soat, soatPhotoFileId),
      });

      // RF-02, casuística C (13-C): quien registra su primer vehículo desde el perfil entra
      // al dashboard en modo conductor. Si no se puede (RN-48, viaje en curso), vuelve al perfil.
      let switchedToDriver = false;
      if (isNew && returnTo === "/perfil") {
        try {
          await profileService.changeMode("DRIVER");
          switchedToDriver = true;
        } catch {
          // El vehículo ya quedó registrado; el perfil explica por qué no cambió el modo.
        }
      }

      // El vehículo también se muestra en el perfil y se copia en los viajes del conductor.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["users", "me"] }),
        queryClient.invalidateQueries({ queryKey: ["rides"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
      ]);
      if (switchedToDriver) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate(returnTo, { replace: true, state: { saved: "vehicle" } });
      }
    } catch (err) {
      const apiErrors = toVehicleApiErrors(err);
      setErrors({ fields: apiErrors.fields, soat: apiErrors.soat });
      setError(apiErrors.general);
    } finally {
      setIsSubmitting(false);
    }
  };

  const layout = {
    backTo: returnTo,
    flowHeader: true,
    title: isNew ? "Registrar vehículo" : "Actualizar vehículo",
  };

  if (vehicleQuery.isLoading) {
    return (
      <AuthStepLayout {...layout}>
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          Cargando tu vehículo...
        </p>
      </AuthStepLayout>
    );
  }

  if (vehicleQuery.error && !isNew) {
    return (
      <AuthStepLayout {...layout}>
        <div className="auth-message auth-message-error" role="alert">
          {vehicleQuery.error.message}
        </div>
        <button
          type="button"
          className="auth-button-primary"
          onClick={() => vehicleQuery.refetch()}
        >
          Reintentar
        </button>
      </AuthStepLayout>
    );
  }

  return (
    <AuthStepLayout {...layout} onBack={() => (isDirty ? setConfirmDiscard(true) : leave())}>
      <form onSubmit={handleSubmit} noValidate className="form-filled">
        {vehicle ? (
          vehicle.status === "ACTIVE" ? (
            <p className="status-chip status-chip-green mb-3 px-3 py-1 text-sm">
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              Vehículo activo
            </p>
          ) : (
            <p className="status-chip mb-3 bg-[var(--surface-muted)] px-3 py-1 text-sm text-[var(--text-brown)]">
              Vehículo inactivo
            </p>
          )
        ) : null}

        <p className="mb-4 text-sm text-[var(--text-brown)]">
          {isNew
            ? "Registra tu vehículo y su SOAT para publicar viajes como conductor."
            : "Mantén al día los datos de tu vehículo y tu SOAT para seguir publicando viajes."}
        </p>

        {/* 16-D: mismo umbral que el perfil (RF-14). */}
        {vehicle?.soat && savedSoatState && savedSoatState.kind !== "valid" ? (
          <p className="amber-strip mb-4" role="status">
            <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {savedSoatState.kind === "expired"
              ? "Tu SOAT venció. Renuévalo y actualiza los datos para seguir publicando viajes."
              : `Tu SOAT vence el ${formatSoatDayMonth(vehicle.soat.endDate)}. Renuévalo y actualiza los datos para seguir publicando viajes.`}
          </p>
        ) : null}

        <VehiclePhotoPicker
          previewUrl={photo.previewUrl ?? resolveFileUrl(vehicle?.photoUrl)}
          hasNewPhoto={Boolean(photo.file)}
          onSelect={(file) => {
            setErrors((current) => ({ ...current, photo: undefined }));
            photo.select(file);
          }}
          onRemove={photo.clear}
          plate={vehicle?.plate}
          error={errors.photo}
        />
        {errors.photo || photo.error ? (
          <div className="-mt-3 mb-5">
            <FieldError>{photo.error || errors.photo}</FieldError>
          </div>
        ) : null}

        <VehicleFields
          values={form.vehicle}
          errors={errors.fields}
          onChange={(field, value) => {
            setErrors((current) => ({ ...current, fields: { ...current.fields, [field]: undefined } }));
            const nextVehicle = { ...form.vehicle, [field]: value };
            // Al pasar a Moto la tarjeta desaparece; al volver a un auto reaparece sin marcar (16-C).
            const typeChanged =
              field === "type" && (value === "MOTORCYCLE") !== (form.vehicle.type === "MOTORCYCLE");
            patch({
              vehicle: nextVehicle,
              ...(typeChanged ? { accessibility: NO_ACCESSIBILITY } : {}),
            });
          }}
        />

        {isMoto ? null : (
          <VehicleAccessibilityCard
            value={form.accessibility}
            onChange={(accessibility) => patch({ accessibility })}
          />
        )}

        <SoatCard
          value={form.soat}
          errors={errors.soat}
          onChange={(soat) => {
            setErrors((current) => ({ ...current, soat: { photo: current.soat.photo } }));
            patch({ soat });
          }}
          photo={{
            fileName: soatPhoto.file?.name ?? null,
            hasSaved: Boolean(vehicle?.soat?.photoUrl),
            error: soatPhoto.error,
          }}
          onSelectPhoto={(file) => {
            setErrors((current) => ({ ...current, soat: { ...current.soat, photo: undefined } }));
            soatPhoto.select(file);
          }}
        />

        <div className="rounded-2xl bg-[#f3f3f3] px-4 py-4">
          <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            Confirmaciones
          </p>

          <label className="form-check-option mb-0 mt-3">
            <input
              type="checkbox"
              checked={form.isOwner}
              onChange={(event) => patch({ isOwner: event.target.checked })}
              className="app-checkbox form-checkbox"
            />
            <span>Soy el propietario legal o conductor autorizado de este vehículo</span>
          </label>

          <label className="form-check-option mb-0 mt-3">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              aria-invalid={errors.terms ? true : undefined}
              onChange={(event) => {
                setErrors((current) => ({ ...current, terms: undefined }));
                patch({ acceptedTerms: event.target.checked });
              }}
              className={`app-checkbox form-checkbox${errors.terms ? " form-checkbox-error" : ""}`}
            />
            <span>
              Acepto los términos y condiciones para el registro y actualización de
              vehículos en ColaboraCar
            </span>
          </label>
          {errors.terms ? <FieldError>{errors.terms}</FieldError> : null}
        </div>

        <p className="form-note mt-4 text-sm">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Los cambios se aplican también a tus viajes publicados. Las reservas ya hechas
          conservan los datos anteriores.
        </p>

        {error ? (
          <div className="dashboard-alert mt-4" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          className="auth-button-primary mt-5 gap-2"
          disabled={isSubmitting}
        >
          <SaveIcon className="h-5 w-5" />
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          type="button"
          className="mt-2 w-full py-2 text-center text-[0.9375rem] text-[var(--text-muted)]"
          onClick={() => (isDirty ? setConfirmDiscard(true) : leave())}
        >
          Descartar cambios
        </button>
      </form>

      {confirmDiscard ? (
        <DiscardChangesSheet
          onDiscard={() => {
            setConfirmDiscard(false);
            leave();
          }}
          onClose={() => setConfirmDiscard(false)}
        />
      ) : null}
    </AuthStepLayout>
  );
}
