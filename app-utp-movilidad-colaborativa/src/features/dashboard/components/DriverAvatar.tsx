import { useEffect, useState } from "react";
import { resolveFileUrl } from "@/shared/api/fileService";

type DriverAvatarProps = {
  name: string;
  photoUrl?: string | null;
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Foto de la persona o, si no tiene o no carga, sus iniciales. */
export function DriverAvatar({
  name,
  photoUrl,
  className = "driver-avatar",
}: DriverAvatarProps) {
  const src = resolveFileUrl(photoUrl);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [src]);

  return (
    <div className={className} aria-hidden="true">
      {src && !hasFailed ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setHasFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
