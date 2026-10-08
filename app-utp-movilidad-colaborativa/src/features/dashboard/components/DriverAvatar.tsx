type DriverAvatarProps = {
  name: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DriverAvatar({ name }: DriverAvatarProps) {
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-bold text-slate-700"
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
