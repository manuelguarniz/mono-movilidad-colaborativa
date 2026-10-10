import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { authService } from "@/features/auth/services/authService";
import { VehicleFields } from "@/features/vehicles/components/VehicleFields";
import { VehiclePhotoPicker } from "@/features/vehicles/components/VehiclePhotoPicker";
import { vehicleService } from "@/features/vehicles/services/vehicleService";
import {
  DNI,
  EMPTY_VEHICLE_FORM,
  toVehicleData,
  validateVehicleForm,
  type VehicleFormValues,
} from "@/features/vehicles/utils/vehicleForm";
import { getUploadErrorMessage, uploadPhoto } from "@/shared/api/fileService";
import { usePhotoSelection } from "@/shared/hooks/usePhotoSelection";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";

/**
 * «Datos del vehículo» (frame 05): último paso del registro cuando el usuario marcó
 * «Tengo vehículo». Usa el token REGISTRATION que dejó el registro.
 */
export function RegisterVehiclePage() {
  const navigate = useNavigate();
  const photo = usePhotoSelection();
  const [form, setForm] = useState<VehicleFormValues>(EMPTY_VEHICLE_FORM);
  const [ownerDni, setOwnerDni] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authService.getPendingProfileRegistration()) {
      navigate("/auth/register", { replace: true });
    }
  }, [navigate]);

  // Todos los campos son obligatorios, excepto «Soy el propietario» y la foto (RN-06).
  const validate = () => {
    const formError = validateVehicleForm(form);
    if (formError) {
      return formError;
    }
    if (!ownerDni) {
      return "El DNI del propietario es obligatorio";
    }
    if (!DNI.test(ownerDni)) {
      return "El DNI debe tener 8 dígitos";
    }
    if (!acceptedTerms) {
      return "Debes aceptar los términos y condiciones";
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

    const token = authService.getPendingProfileRegistration()?.token;
    setIsSubmitting(true);

    try {
      let photoFileId: string | undefined;
      if (photo.file) {
        try {
          photoFileId = (await uploadPhoto(photo.file, "VEHICLE_PHOTO", token)).id;
        } catch (uploadError) {
          setError(getUploadErrorMessage(uploadError));
          return;
        }
      }

      await vehicleService.register(
        {
          ...toVehicleData(form),
          ownerDni,
          isOwner,
          acceptedTerms: true,
          photoFileId,
        },
        token,
      );

      authService.clearPendingProfileRegistration();
      navigate("/auth/login", { replace: true, state: { profileCompleted: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el vehículo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthStepLayout
      backTo="/auth/login"
      title="Datos del Vehículo"
      subtitle="Registra tu vehículo para empezar a compartir viajes."
      showBrandHeader
    >
      <form onSubmit={handleSubmit}>
        <VehiclePhotoPicker
          previewUrl={photo.previewUrl}
          hasNewPhoto={Boolean(photo.file)}
          onSelect={photo.select}
          onRemove={photo.clear}
        />

        <VehicleFields
          values={form}
          onChange={(field, value) => {
            setError("");
            setForm((current) => ({ ...current, [field]: value }));
          }}
        />

        <AuthField
          label="DNI del propietario"
          value={ownerDni}
          placeholder="Ingrese su DNI"
          inputMode="numeric"
          maxLength={8}
          onChange={(value) => setOwnerDni(value.replace(/\D/g, ""))}
          icon={<IdCardIcon className="h-6 w-6" />}
        />

        <label className="form-check-option">
          <input
            type="checkbox"
            checked={isOwner}
            onChange={(event) => setIsOwner(event.target.checked)}
            className="app-checkbox"
          />
          <span>Soy el propietario del vehículo</span>
        </label>

        <label className="form-check-option">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              setError("");
              setAcceptedTerms(event.target.checked);
            }}
            className="app-checkbox"
          />
          <span>Acepto los términos y condiciones para el registro de vehículos</span>
        </label>

        {error || photo.error ? (
          <div className="auth-message auth-message-error mt-4" role="alert">
            {error || photo.error}
          </div>
        ) : null}

        <button type="submit" className="auth-button-primary mt-4" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Terminar"}
        </button>
      </form>
    </AuthStepLayout>
  );
}
