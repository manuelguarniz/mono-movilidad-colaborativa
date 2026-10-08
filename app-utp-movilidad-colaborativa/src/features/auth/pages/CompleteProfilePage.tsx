import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelectField } from "@/features/auth/components/AuthSelectField";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { ProfilePhotoPicker } from "@/features/auth/components/ProfilePhotoPicker";
import {
  CAMPUSES,
  DEPARTMENTS,
  DISTRICTS,
} from "@/features/auth/data/profileOptions";
import { authService } from "@/features/auth/services/authService";
import UserIcon from "@/assets/images/icons/user.svg?react";
import ListIcon from "@/assets/images/icons/list.svg?react";
import MapPinIcon from "@/assets/images/icons/map-pin.svg?react";
import GraduationCapIcon from "@/assets/images/icons/graduation-cap.svg?react";

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  const pendingRegistration = authService.getPendingProfileRegistration();

  useEffect(() => {
    const pending = authService.getPendingProfileRegistration();

    if (!pending) {
      navigate("/auth/register", { replace: true });
      return;
    }

    const [firstName = "", lastName = ""] = pending.name.split(" ");
    setForm((current) => ({
      ...current,
      firstName,
      lastName,
    }));
  }, [navigate]);

  const districtOptions = form.department
    ? (DISTRICTS[form.department] ?? [])
    : [];

  const handleChange = (
    field: keyof typeof form,
    value: string | boolean,
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "department") {
        next.district = "";
      }

      return next;
    });
  };

  const handlePhotoSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return previewUrl;
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
      await authService.completeProfile({
        ...form,
        registrationId: pendingRegistration?.registrationId,
      });
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
      <ProfilePhotoPicker previewUrl={photoPreview} onSelect={handlePhotoSelect} />

      <form onSubmit={handleSubmit} className="mt-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
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
          options={DEPARTMENTS}
          onChange={(value) => handleChange("department", value)}
          icon={
            <ListIcon className="h-6 w-6" />
          }
        />

        <AuthSelectField
          label="Distrito"
          value={form.district}
          placeholder="Selecciona tu distrito"
          options={districtOptions}
          disabled={!form.department}
          onChange={(value) => handleChange("district", value)}
          icon={
            <MapPinIcon className="h-6 w-6" />
          }
        />

        <AuthSelectField
          label="Sede universitaria"
          value={form.campus}
          placeholder="Selecciona tu sede"
          options={CAMPUSES}
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
            className="profile-vehicle-checkbox"
          />
          <span className="text-base font-black text-[#2f2a2a]">
            Tengo vehículo
          </span>
        </label>

        <button
          type="submit"
          className="auth-button-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Terminar"}
        </button>
      </form>
    </AuthStepLayout>
  );
}
