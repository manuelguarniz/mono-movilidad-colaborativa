import CarSvg from "@/assets/images/icons/car.svg?react";
import type { IconProps } from "@/shared/icons/types";

export function CarIcon({
  className = "h-4 w-4",
  size,
  ...props
}: IconProps) {
  return (
    <CarSvg
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    />
  );
}
