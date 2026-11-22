import { AuthField } from "@/features/auth/components/AuthField";
import { AuthSelectField } from "@/features/auth/components/AuthSelectField";
import { FieldError } from "@/features/auth/components/FieldError";
import { getSoatState } from "@/features/profile/utils/soat";
import {
  INSURER_OPTIONS,
  OTHER_INSURER,
  type SoatErrors,
  type SoatForm,
} from "@/features/vehicles/utils/soatForm";
import { PHOTO_ACCEPT } from "@/shared/api/fileService";
import AlertIcon from "@/assets/images/icons/alert-circle.svg?react";
import IdCardIcon from "@/assets/images/icons/id-card.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import ShieldIcon from "@/assets/images/icons/shield-check.svg?react";

type SoatCardProps = {
  value: SoatForm;
  errors: SoatErrors;
  onChange: (next: SoatForm) => void;
  // Certificado: nombre del archivo nuevo, o `true` si ya hay uno guardado.
  photo: { fileName: string | null; hasSaved: boolean; error: string };
  onSelectPhoto: (file: File) => void;
};

/** Chip del SOAT (ajuste 5 de P16): «Vigente» con más de 15 días, «Vence en N días» con menos. */
function SoatChip({ value, errors }: { value: SoatForm; errors: SoatErrors }) {
  if (!value.startDate || !value.endDate || errors.validity || errors.endDate) {
    return null;
  }
  const state = getSoatState({ endDate: value.endDate });
  if (state.kind === "expired") {
    return null;
  }
  if (state.kind === "valid") {
    return <span className="status-chip status-chip-green">Vigente</span>;
  }
  return (
    <span className="status-chip status-chip-amber">
      {state.daysLeft === 0
        ? "Vence hoy"
        : `Vence en ${state.daysLeft} ${state.daysLeft === 1 ? "día" : "días"}`}
    </span>
  );
}

/** Tarjeta «SOAT» de P05 y P16 (16-A, 16-B, 16-D; RN-36). */
export function SoatCard({ value, errors, onChange, photo, onSelectPhoto }: SoatCardProps) {
  const set = (patch: Partial<SoatForm>) => onChange({ ...value, ...patch });
  const hasPhoto = Boolean(photo.fileName) || photo.hasSaved;

  const input = (
    <input
      type="file"
      accept={PHOTO_ACCEPT}
      className="sr-only"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) {
          onSelectPhoto(file);
        }
        event.target.value = "";
      }}
    />
  );

  return (
    <section className="form-card" aria-labelledby="soat-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p id="soat-title" className="form-card-label">
          <ShieldIcon className="h-5 w-5" aria-hidden="true" />
          SOAT
        </p>
        <SoatChip value={value} errors={errors} />
      </div>

      {/* 16-B: una sola franja por sección (#5). */}
      {errors.validity ? (
        <div className="dashboard-alert mb-4" role="alert">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{errors.validity}</p>
        </div>
      ) : null}

      <AuthSelectField
        label="Aseguradora"
        value={value.insurer}
        placeholder="Selecciona tu aseguradora"
        options={INSURER_OPTIONS}
        onChange={(insurer) => set({ insurer })}
        icon={<ShieldIcon className="h-5 w-5" />}
        error={value.insurer === OTHER_INSURER ? undefined : errors.insurer}
      />

      {value.insurer === OTHER_INSURER ? (
        <AuthField
          label="Nombre de la aseguradora"
          value={value.otherInsurer}
          maxLength={60}
          onChange={(otherInsurer) => set({ otherInsurer })}
          error={errors.insurer}
        />
      ) : null}

      <AuthField
        label="Número de póliza"
        value={value.policyNumber}
        placeholder="Ej: 2401-123456"
        maxLength={20}
        autoComplete="off"
        onChange={(policyNumber) =>
          set({ policyNumber: policyNumber.replace(/[^A-Za-z0-9-]/g, "").toUpperCase() })
        }
        icon={<IdCardIcon className="h-5 w-5" />}
        error={errors.policyNumber}
      />

      <div className="grid grid-cols-2 gap-3">
        <AuthField
          label="Inicio"
          type="date"
          value={value.startDate}
          onChange={(startDate) => set({ startDate })}
          error={errors.startDate ?? (errors.validity ? " " : undefined)}
        />
        <AuthField
          label="Fin"
          type="date"
          value={value.endDate}
          min={value.startDate || undefined}
          onChange={(endDate) => set({ endDate })}
          error={errors.endDate ?? (errors.validity ? " " : undefined)}
        />
      </div>

      {hasPhoto ? (
        <div className={errors.photo ? "soat-file auth-input-error" : "soat-file"}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--brand-red)]">
            <IdCardIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              Certificado del SOAT
            </span>
            <span className="block truncate text-[0.8125rem] text-[var(--text-brown)]">
              {photo.fileName ?? "Certificado guardado"}
            </span>
            <span className="block text-xs text-[var(--text-muted)]">JPG o PNG, hasta 5 MB</span>
          </span>
          <label className="cursor-pointer text-sm font-semibold text-[var(--brand-red)]">
            {input}
            Cambiar
          </label>
        </div>
      ) : (
        <label className={errors.photo ? "soat-file-empty auth-input-error" : "soat-file-empty"}>
          {input}
          <IdCardIcon className="h-8 w-8 text-[var(--brand-red)]" aria-hidden="true" />
          <span className="text-sm font-semibold text-[var(--text-brown)]">
            Subir certificado del SOAT
          </span>
          <span className="text-xs text-[var(--text-muted)]">JPG o PNG, hasta 5 MB</span>
        </label>
      )}
      {errors.photo || photo.error ? <FieldError>{photo.error || errors.photo}</FieldError> : null}

      <p className="form-note">
        <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Solo tú ves la foto del certificado.
      </p>
      <p className="form-note mt-1.5">
        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Es una declaración tuya: ColaboraCar no verifica el SOAT con la aseguradora. Los pasajeros
        verán «SOAT declarado por el conductor».
      </p>
    </section>
  );
}
