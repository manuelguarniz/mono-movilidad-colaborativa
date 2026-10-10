import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelectField } from "@/features/auth/components/AuthSelectField";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { ProfilePhotoPicker } from "@/features/auth/components/ProfilePhotoPicker";
import { authService } from "@/features/auth/services/authService";
import {
  catalogService,
  type CatalogItem,
} from "@/features/auth/services/catalogService";
import { getUploadErrorMessage, uploadPhoto } from "@/shared/api/fileService";
import { usePhotoSelection } from "@/shared/hooks/usePhotoSelection";
import UserIcon from "@/assets/images/icons/user.svg?react";
import MapIcon from "@/assets/images/icons/map.svg?react";
import MapPinIcon from "@/assets/images/icons/map-pin.svg?react";
import GraduationCapIcon from "@/assets/images/icons/graduation-cap.svg?react";

const toOptions = (items: CatalogItem[] = []) =>
  items.map((item) => ({ value: item.id, label: item.name }));

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const photo = usePhotoSelection();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    department: "",
    district: "",
    campus: "",
    hasVehicle: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authService.getPendingProfileRegistration()) {
      navigate("/auth/register", { replace: true });
    }
  }, [navigate]);

  const { data: departments } = useQuery({
    queryKey: ["catalogs", "departments"],
    queryFn: catalogService.getDepartments,
  });

  const { data: districts } = useQuery({
    queryKey: ["catalogs", "districts", form.department],
    queryFn: () => catalogService.getDistricts(form.department),
    enabled: Boolean(form.department),
  });

  // Las sedes se listan por distrito.
  const { data: campuses } = useQuery({
    queryKey: ["catalogs", "campuses", form.district],
    queryFn: () => catalogService.getCampuses(form.district),
    enabled: Boolean(form.district),
  });

  const handleChange = (
    field: keyof typeof form,
    value: string | boolean,
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "department") {
        next.district = "";
      }

      if (field === "department" || field === "district") {
        next.campus = "";
      }

      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (
      !form.firstName ||
      !form.lastName ||
      !form.department ||
      !form.district ||
      !form.campus
    ) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);

    try {
      let photoFileId: string | undefined;
      if (photo.file) {
        try {
          const token = authService.getPendingProfileRegistration()?.token;
          photoFileId = (await uploadPhoto(photo.file, "PROFILE_PHOTO", token)).id;
        } catch (uploadError) {
          setError(getUploadErrorMessage(uploadError));
          return;
        }
      }

      await authService.completeProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        departmentId: form.department,
        districtId: form.district,
        campusId: form.campus,
        photoFileId,
      });

      // Con «Tengo vehículo» el registro continúa con los datos del vehículo (RF-07).
      if (form.hasVehicle) {
        navigate("/auth/datos-vehiculo", { replace: true });
        return;
      }

      authService.clearPendingProfileRegistration();
      navigate("/auth/login", {
        replace: true,
        state: { profileCompleted: true },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo completar el perfil",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthStepLayout
      backTo="/auth/register"
      title="Completa tu perfil"
      subtitle="Solo unos datos más para empezar a viajar."
      showBrandHeader
    >
      <ProfilePhotoPicker
        previewUrl={photo.previewUrl}
        onSelect={photo.select}
        onRemove={photo.clear}
      />

      <form onSubmit={handleSubmit} className="mt-6">
        {error || photo.error ? (
          <div className="auth-message auth-message-error" role="alert">
            {error || photo.error}
          </div>
        ) : null}

        <AuthField
          label="Nombres"
          value={form.firstName}
          placeholder="Ej. Juan Carlos"
          autoComplete="given-name"
          onChange={(value) => handleChange("firstName", value)}
          icon={
            <UserIcon className="h-6 w-6" />
          }
        />

        <AuthField
          label="Apellidos"
          value={form.lastName}
          placeholder="Ej. Pérez"
          autoComplete="family-name"
          onChange={(value) => handleChange("lastName", value)}
          icon={
            <UserIcon className="h-6 w-6" />
          }
        />

        <AuthSelectField
          label="Departamento"
          value={form.department}
          placeholder="Selecciona tu departamento"
          options={toOptions(departments)}
          onChange={(value) => handleChange("department", value)}
          icon={
            <MapIcon className="h-6 w-6" />
          }
        />

        <AuthSelectField
          label="Distrito"
          value={form.district}
          placeholder="Selecciona tu distrito"
          options={toOptions(districts)}
          disabled={!form.department}
          onChange={(value) => handleChange("district", value)}
          icon={
            <MapPinIcon className="h-6 w-6" />
          }
        />

        <AuthSelectField
          label="Sede Universitaria"
          value={form.campus}
          placeholder="Selecciona tu sede"
          options={toOptions(campuses)}
          disabled={!form.district}
          onChange={(value) => handleChange("campus", value)}
          icon={
            <GraduationCapIcon className="h-6 w-6" />
          }
        />

        <label className="profile-vehicle-option">
          <input
            type="checkbox"
            checked={form.hasVehicle}
            onChange={(event) => handleChange("hasVehicle", event.target.checked)}
            className="app-checkbox profile-vehicle-checkbox"
          />
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            Tengo vehículo
          </span>
        </label>

        <button
          type="submit"
          className="auth-button-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Guardando..."
            : form.hasVehicle
              ? "Continuar"
              : "Terminar"}
        </button>
      </form>
    </AuthStepLayout>
  );
}
