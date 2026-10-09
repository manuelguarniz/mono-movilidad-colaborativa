import logoUrl from "@/assets/images/logo-colaboracar.svg";

type BrandLogoProps = {
  bordered?: boolean;
};

/** Logo dentro del recuadro blanco de los mockups. */
export function BrandLogo({ bordered = false }: BrandLogoProps) {
  return (
    <div
      className={
        bordered
          ? "auth-logo-box rounded-xl border border-[var(--border-neutral)]"
          : "auth-logo-box"
      }
    >
      <img
        src={logoUrl}
        alt=""
        decoding="async"
        draggable={false}
        className="h-7 w-auto select-none"
      />
      <span className="auth-logo-box-wordmark">ColaboraCar</span>
    </div>
  );
}
