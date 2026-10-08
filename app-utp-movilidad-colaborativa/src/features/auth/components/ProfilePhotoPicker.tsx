import UserSolidIcon from "@/assets/images/icons/user-solid.svg?react";
import CameraIcon from "@/assets/images/icons/camera.svg?react";

type ProfilePhotoPickerProps = {
  previewUrl?: string | null;
  onSelect: (file: File) => void;
};

export function ProfilePhotoPicker({
  previewUrl,
  onSelect,
}: ProfilePhotoPickerProps) {
  return (
    <div className="profile-photo-picker">
      <div className="profile-photo-circle">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Vista previa de perfil"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserSolidIcon
            className="h-16 w-16 text-[#9a9a9a]"
            aria-hidden="true"
          />
        )}
      </div>

      <label className="profile-photo-camera-button">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onSelect(file);
            }
          }}
        />
        <CameraIcon className="h-5 w-5" aria-hidden="true" />
      </label>
    </div>
  );
}
