import { PHOTO_ACCEPT } from "@/shared/api/fileService";
import CameraIcon from "@/assets/images/icons/camera.svg?react";

type VehiclePhotoPickerProps = {
  // Foto nueva elegida o foto actual del vehículo.
  previewUrl?: string | null;
  // `true` si la vista previa es una foto recién elegida, que se puede quitar.
  hasNewPhoto: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

export function VehiclePhotoPicker({
  previewUrl,
  hasNewPhoto,
  onSelect,
  onRemove,
}: VehiclePhotoPickerProps) {
  const input = (
    <input
      type="file"
      accept={PHOTO_ACCEPT}
      className="sr-only"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) {
          onSelect(file);
        }
        // Permite volver a elegir el mismo archivo después de quitarlo.
        event.target.value = "";
      }}
    />
  );

  if (!previewUrl) {
    return (
      <label className="vehicle-photo-empty">
        {input}
        <CameraIcon className="h-9 w-9 text-[var(--brand-red)]" aria-hidden="true" />
        <span className="text-sm font-semibold text-[var(--text-brown)]">
          Subir foto del vehículo
        </span>
        <span className="text-xs text-[var(--text-muted)]">JPG o PNG, máximo 5 MB</span>
      </label>
    );
  }

  return (
    <div className="mb-5 overflow-hidden rounded-xl bg-[#f3f3f3]">
      <img src={previewUrl} alt="Foto del vehículo" className="h-44 w-full object-cover" />
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {hasNewPhoto ? "Foto nueva" : "Foto actual del auto"}
        </p>
        <div className="flex items-center gap-3">
          {hasNewPhoto ? (
            <button
              type="button"
              className="text-sm font-medium text-[var(--text-muted)]"
              onClick={onRemove}
            >
              Quitar
            </button>
          ) : null}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[var(--brand-red)] shadow-sm">
            {input}
            <CameraIcon className="h-4 w-4" aria-hidden="true" />
            Cambiar foto
          </label>
        </div>
      </div>
    </div>
  );
}
