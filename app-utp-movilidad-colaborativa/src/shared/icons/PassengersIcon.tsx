import PassengersSvg from "@/assets/images/icons/passengers.svg?react";
import type { IconProps } from "@/shared/icons/types";

export function PassengersIcon({
  className = "h-4 w-4",
  size,
  ...props
}: IconProps) {
  return (
    <PassengersSvg
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    />
  );
}
