import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { FieldError } from "@/features/auth/components/FieldError";
import { authService } from "@/features/auth/services/authService";
import { SoatCard } from "@/features/vehicles/components/SoatCard";
import { VehicleAccessibilityCard } from "@/features/vehicles/components/VehicleAccessibilityCard";
import { VehicleFields } from "@/features/vehicles/components/VehicleFields";
import { VehiclePhotoPicker } from "@/features/vehicles/components/VehiclePhotoPicker";
import { vehicleService } from "@/features/vehicles/services/vehicleService";
import type { VehicleAccessibility } from "@/features/vehicles/types";
import {
  EMPTY_SOAT_FORM,
  toSoatRequest,
  validateSoat,
  type SoatErrors,
  type SoatForm,
} from "@/features/vehicles/utils/soatForm";
import { toVehicleApiErrors } from "@/features/vehicles/utils/vehicleApiErrors";
import {
  DNI,
  EMPTY_VEHICLE_FORM,
  toVehicleData,
  validateVehicleForm,
  type VehicleFieldErrors,
  type VehicleFormValues,
} from "@/features/vehicles/utils/vehicleForm";
import { getUploadErrorMessage, uploadPhoto } from "@/shared/api/fileService";
import { usePhotoSelection } from "@/shared/hooks/usePhotoSelection";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";

const NO_ACCESSIBILITY: VehicleAccessibility = { wheelchair: false, boardingAssistance: false };

type Errors = {
  fields: VehicleFieldErrors;
  soat: SoatErrors;
  ownerDni?: string;
  terms?: string;
};

const NO_ERRORS: Errors = { fields: {}, soat: {} };

/**
 * «Datos del vehículo» (frame 05): último paso del registro cuando el usuario marcó
 * «Tengo vehículo». Usa el token REGISTRATION que dejó el registro. Pide la accesibilidad
 * (RN-18) y el SOAT obligatorio (RN-36), con los mismos componentes que P16.
 */
export function RegisterVehiclePage() {
  const navigate = useNavigate();
  const photo = usePhotoSelection();
  const soatPhoto = usePhotoSelection();
  const [form, setForm] = useState<VehicleFormValues>(EMPTY_VEHICLE_FORM);
  const [accessibility, setAccessibility] = useState<VehicleAccessibility>(NO_ACCESSIBILITY);
  const [soat, setSoat] = useState<SoatForm>(EMPTY_SOAT_FORM);
  const [ownerDni, setOwnerDni] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authService.getPendingProfileRegistration()) {
      navigate("/auth/register", { replace: true });
    }
  }, [navigate]);

  const isMoto = form.type === "MOTORCYCLE";

  // Todo es obligatorio, incluido el SOAT, excepto «Soy el propietario», la foto del
  // vehículo y la accesibilidad (RN-06).
  const validate = (): Errors => ({
    fields: validateVehicleForm(form),
    soat: validateSoat(soat, Boolean(soatPhoto.file)),
    ownerDni: !ownerDni
      ? "El DNI del propietario es obligatorio"
      : DNI.test(ownerDni)
        ? undefined
        : "El DNI debe tener 8 dígitos",
    terms: acceptedTerms ? undefined : "Debes aceptar los términos y condiciones",
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setError("");
    if (
      Object.keys(validationErrors.fields).length > 0 ||
      Object.keys(validationErrors.soat).length > 0 ||
      validationErrors.ownerDni ||
      validationErrors.terms
    ) {
      return;
    }

    const token = authService.getPendingProfileRegistration()?.token;
    setIsSubmitting(true);

    try {
      let photoFileId: string | undefined;
      let soatPhotoFileId: string | undefined;
      try {
        if (photo.file) {
          photoFileId = (await uploadPhoto(photo.file, "VEHICLE_PHOTO", token)).id;
        }
        if (soatPhoto.file) {
          soatPhotoFileId = (await uploadPhoto(soatPhoto.file, "SOAT_PHOTO", token)).id;
        }
      } catch (uploadError) {
        setError(getUploadErrorMessage(uploadError));
        return;
      }

      await vehicleService.register(
        {
          ...toVehicleData(form),
          ownerDni,
          isOwner,
          acceptedTerms: true,
          photoFileId,
          accessibility: isMoto ? NO_ACCESSIBILITY : accessibility,
          soat: toSoatRequest(soat, soatPhotoFileId),
        },
        token,
      );

      authService.clearPendingProfileRegistration();
      navigate("/auth/login", { replace: true, state: { profileCompleted: true } });
    } catch (err) {
      const apiErrors = toVehicleApiErrors(err);
      setErrors({ fields: apiErrors.fields, soat: apiErrors.soat });
      setError(apiErrors.general);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthStepLayout
      backTo="/auth/login"
      title="Datos del vehículo"
      subtitle="Registra tu vehículo y su SOAT para empezar a compartir viajes."
      showBrandHeader
    >
      <form onSubmit={handleSubmit} noValidate className="form-filled">
        <VehiclePhotoPicker
          previewUrl={photo.previewUrl}
          hasNewPhoto={Boolean(photo.file)}
          onSelect={photo.select}
          onRemove={photo.clear}
        />
        {photo.error ? (
          <div className="-mt-3 mb-5">
            <FieldError>{photo.error}</FieldError>
          </div>
        ) : null}

        <VehicleFields
          values={form}
          errors={errors.fields}
          onChange={(field, value) => {
            setError("");
            setErrors((current) => ({ ...current, fields: { ...current.fields, [field]: undefined } }));
            if (field === "type" && (value === "MOTORCYCLE") !== isMoto) {
              setAccessibility(NO_ACCESSIBILITY);
            }
            setForm((current) => ({ ...current, [field]: value }));
          }}
        />

        <AuthField
          label="DNI del propietario"
          value={ownerDni}
          placeholder="Ingrese su DNI"
          inputMode="numeric"
          maxLength={8}
          onChange={(value) => {
            setErrors((current) => ({ ...current, ownerDni: undefined }));
            setOwnerDni(value.replace(/\D/g, ""));
          }}
          icon={<IdCardIcon className="h-6 w-6" />}
          error={errors.ownerDni}
        />

        {isMoto ? null : (
          <VehicleAccessibilityCard value={accessibility} onChange={setAccessibility} />
        )}

        <SoatCard
          value={soat}
          errors={errors.soat}
          onChange={(next) => {
            setErrors((current) => ({ ...current, soat: { photo: current.soat.photo } }));
            setSoat(next);
          }}
          photo={{ fileName: soatPhoto.file?.name ?? null, hasSaved: false, error: soatPhoto.error }}
          onSelectPhoto={(file) => {
            setErrors((current) => ({ ...current, soat: { ...current.soat, photo: undefined } }));
            soatPhoto.select(file);
          }}
        />

        <label className="form-check-option">
          <input
            type="checkbox"
            checked={isOwner}
            onChange={(event) => setIsOwner(event.target.checked)}
            className="app-checkbox form-checkbox"
          />
          <span>Soy el propietario del vehículo</span>
        </label>

        <label className="form-check-option mb-0">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              setErrors((current) => ({ ...current, terms: undefined }));
              setAcceptedTerms(event.target.checked);
            }}
            className={`app-checkbox form-checkbox${errors.terms ? " form-checkbox-error" : ""}`}
          />
          <span>Acepto los términos y condiciones para el registro de vehículos</span>
        </label>
        {errors.terms ? <FieldError>{errors.terms}</FieldError> : null}

        {error ? (
          <div className="dashboard-alert mt-4" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        <button type="submit" className="auth-button-primary mt-5" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Terminar"}
        </button>
      </form>
    </AuthStepLayout>
  );
}
