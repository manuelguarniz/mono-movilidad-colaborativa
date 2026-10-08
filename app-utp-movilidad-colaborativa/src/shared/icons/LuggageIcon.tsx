import LuggageSvg from "@/assets/images/icons/luggage.svg?react";
import type { IconProps } from "@/shared/icons/types";

export function LuggageIcon({
  className = "h-4 w-4",
  size,
  ...props
}: IconProps) {
  return (
    <LuggageSvg
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    />
  );
}
