import { PHOTO_ACCEPT } from "@/shared/api/fileService";
import UserIcon from "@/assets/images/icons/user.svg?react";
import CameraIcon from "@/assets/images/icons/camera.svg?react";

type ProfilePhotoPickerProps = {
  previewUrl?: string | null;
  onSelect: (file: File) => void;
  // Si se pasa y hay una foto elegida, se ofrece quitarla.
  onRemove?: () => void;
};

export function ProfilePhotoPicker({
  previewUrl,
  onSelect,
  onRemove,
}: ProfilePhotoPickerProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="profile-photo-picker">
        <div className="profile-photo-circle">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Vista previa de perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            <UserIcon className="h-9 w-9" aria-hidden="true" />
          )}
        </div>

        <label className="profile-photo-camera-button" aria-label="Elegir foto de perfil">
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
          <CameraIcon className="h-5 w-5" aria-hidden="true" />
        </label>
      </div>

      {onRemove && previewUrl ? (
        <button
          type="button"
          className="text-sm font-medium text-[var(--brand-red)]"
          onClick={onRemove}
        >
          Quitar foto
        </button>
      ) : null}
    </div>
  );
}
