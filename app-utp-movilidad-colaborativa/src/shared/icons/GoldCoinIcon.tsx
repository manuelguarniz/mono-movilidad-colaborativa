import GoldCoinSvg from "@/assets/images/icons/gold-coin.svg?react";
import type { IconProps } from "@/shared/icons/types";

export function GoldCoinIcon({
  className = "h-5 w-5",
  size,
  ...props
}: IconProps) {
  return (
    <GoldCoinSvg
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    />
  );
}
