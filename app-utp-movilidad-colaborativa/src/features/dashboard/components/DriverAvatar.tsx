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

/** Foto de la persona o, si no tiene, sus iniciales. */
export function DriverAvatar({
  name,
  photoUrl,
  className = "driver-avatar",
}: DriverAvatarProps) {
  return (
    <div className={className} aria-hidden="true">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
