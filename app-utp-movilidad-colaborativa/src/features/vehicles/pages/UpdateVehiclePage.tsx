import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { VehicleFields } from "@/features/vehicles/components/VehicleFields";
import { VehiclePhotoPicker } from "@/features/vehicles/components/VehiclePhotoPicker";
import { vehicleService } from "@/features/vehicles/services/vehicleService";
import {
  EMPTY_VEHICLE_FORM,
  toVehicleData,
  toVehicleForm,
  validateVehicleForm,
  type VehicleFormValues,
} from "@/features/vehicles/utils/vehicleForm";
import { ApiError } from "@/shared/api/apiClient";
import {
  getUploadErrorMessage,
  resolveFileUrl,
  uploadPhoto,
} from "@/shared/api/fileService";
import { usePhotoSelection } from "@/shared/hooks/usePhotoSelection";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import SaveIcon from "@/assets/images/icons/save.svg?react";
import ShieldCheckIcon from "@/assets/images/icons/shield-check.svg?react";

const isNotFound = (error: unknown) =>
  error instanceof ApiError && error.status === 404;

/**
 * «Actualizar vehículo» (frame 16). Si el usuario todavía no tiene vehículo, la misma
 * pantalla lo registra: `PUT /vehicles/me` lo crea y le agrega el rol de conductor.
 */
export function UpdateVehiclePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photo = usePhotoSelection();
  const [form, setForm] = useState<VehicleFormValues>(EMPTY_VEHICLE_FORM);
  const [isOwner, setIsOwner] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vehicleQuery = useQuery({
    queryKey: ["vehicles", "me"],
    queryFn: vehicleService.getMine,
    retry: (failureCount, queryError) => !isNotFound(queryError) && failureCount < 1,
  });

  const vehicle = vehicleQuery.data;
  const isNew = isNotFound(vehicleQuery.error);

  const resetForm = () => {
    setForm(vehicle ? toVehicleForm(vehicle) : EMPTY_VEHICLE_FORM);
    setIsOwner(vehicle?.isOwner ?? false);
    setAcceptedTerms(false);
    setError("");
    photo.clear();
  };

  // El formulario parte de los datos guardados.
  useEffect(() => {
    if (vehicle) {
      setForm(toVehicleForm(vehicle));
      setIsOwner(vehicle.isOwner);
    }
  }, [vehicle]);

  // De las casillas, solo es obligatoria la de términos y condiciones (RN-16).
  const validate = () =>
    validateVehicleForm(form) ||
    (acceptedTerms ? "" : "Debes aceptar los términos y condiciones");

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
          photoFileId = (await uploadPhoto(photo.file, "VEHICLE_PHOTO")).id;
        } catch (uploadError) {
          setError(getUploadErrorMessage(uploadError));
          return;
        }
      }

      await vehicleService.updateMine({
        ...toVehicleData(form),
        isOwner,
        acceptedTerms: true,
        photoFileId,
      });

      // El vehículo también se muestra en el perfil y se copia en los viajes del conductor.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["users", "me"] }),
        queryClient.invalidateQueries({ queryKey: ["rides"] }),
      ]);
      navigate("/perfil", { replace: true, state: { saved: "vehicle" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el vehículo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const layout = {
    backTo: "/perfil",
    showBrandHeader: true,
    title: isNew ? "Registrar Vehículo" : "Actualizar Vehículo",
    subtitle: isNew
      ? "Registra tu vehículo para publicar viajes como conductor."
      : "Modifica o actualiza la información de tu vehículo registrado para mantener tus viajes al día.",
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
    <AuthStepLayout {...layout}>
      <form onSubmit={handleSubmit}>
        {vehicle ? (
          <p className="mb-4 flex w-fit items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-brown)]">
            <ShieldCheckIcon className="h-4 w-4 text-[var(--brand-red)]" />
            Vehículo registrado{" "}
            {vehicle.status === "ACTIVE" ? "activo" : "inactivo"}
          </p>
        ) : null}

        <VehiclePhotoPicker
          previewUrl={photo.previewUrl ?? resolveFileUrl(vehicle?.photoUrl)}
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

        <div className="rounded-xl bg-[#f3f3f3] px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <ShieldCheckIcon className="h-5 w-5 text-[var(--brand-red)]" />
            Confirmaciones de seguridad
          </p>

          <label className="form-check-option mt-3">
            <input
              type="checkbox"
              checked={isOwner}
              onChange={(event) => setIsOwner(event.target.checked)}
              className="app-checkbox"
            />
            <span>Soy el propietario legal o conductor autorizado de este vehículo</span>
          </label>

          <label className="form-check-option mb-0">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setError("");
                setAcceptedTerms(event.target.checked);
              }}
              className="app-checkbox"
            />
            <span>
              Acepto los términos y condiciones para el registro y actualización de
              vehículos en ColaboraCar
            </span>
          </label>
        </div>

        <p className="mt-4 flex items-start gap-3 rounded-xl bg-[#f3f3f3] px-4 py-3 text-sm text-[var(--text-muted)]">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-red)]" />
          <span>
            Los cambios de marca, modelo, color y placa se reflejan de inmediato en tus
            viajes publicados. Las plazas de los viajes ya publicados no cambian.
          </span>
        </p>

        {error || photo.error ? (
          <div className="auth-message auth-message-error mt-4" role="alert">
            {error || photo.error}
          </div>
        ) : null}

        <button
          type="submit"
          className="auth-button-primary mt-5 gap-2"
          disabled={isSubmitting}
        >
          <SaveIcon className="h-5 w-5" />
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>

        <button
          type="button"
          className="mt-2 w-full py-2 text-center text-[0.9375rem] text-[var(--text-muted)]"
          onClick={resetForm}
        >
          Descartar cambios
        </button>
      </form>
    </AuthStepLayout>
  );
}
