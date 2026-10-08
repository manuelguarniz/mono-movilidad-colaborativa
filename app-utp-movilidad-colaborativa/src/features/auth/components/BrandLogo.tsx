import logoUrl from "@/assets/images/logo-colaboracar.svg";

type BrandLogoProps = {
  compact?: boolean;
  showWordmark?: boolean;
  inline?: boolean;
};

const LOGO_WIDTH = 788;
const LOGO_HEIGHT = 302;

export function BrandLogo({
  compact = false,
  showWordmark = true,
  inline = false,
}: BrandLogoProps) {
  const iconSize = compact && inline ? "h-8" : compact ? "h-12" : "h-16";

  return (
    <div
      className={
        inline
          ? "flex items-center gap-2"
          : "flex flex-col items-center justify-center gap-2"
      }
    >
      <img
        src={logoUrl}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        decoding="async"
        draggable={false}
        className={`${iconSize} w-auto select-none`}
      />

      {showWordmark ? (
        <div
          className={
            inline
              ? "text-lg font-black leading-none tracking-tight text-[#d93a43]"
              : "text-center text-2xl font-black leading-none tracking-tight text-[#d93a43]"
          }
        ></div>
      ) : (
        <span className="sr-only">ColaboraCar</span>
      )}
    </div>
  );
}
