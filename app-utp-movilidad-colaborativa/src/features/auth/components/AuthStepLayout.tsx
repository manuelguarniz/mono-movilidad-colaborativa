import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/features/auth/components/BrandLogo";
import ArrowLeftIcon from "@/assets/images/icons/arrow-left.svg?react";
import ChevronLeftIcon from "@/assets/images/icons/chevron-left.svg?react";

type AuthStepLayoutProps = {
  backTo: string;
  backIcon?: "arrow" | "chevron";
  title: string;
  subtitle?: string;
  // Recuadro del logo sobre el título: `true`, o `"bordered"` para dibujarlo con borde.
  showLogo?: boolean | "bordered";
  // Cabecera con el nombre de la app y título alineado a la izquierda.
  showBrandHeader?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthStepLayout({
  backTo,
  backIcon = "arrow",
  title,
  subtitle,
  showLogo = false,
  showBrandHeader = false,
  children,
  footer,
}: AuthStepLayoutProps) {
  const BackIcon = backIcon === "chevron" ? ChevronLeftIcon : ArrowLeftIcon;

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-content">
          <div className="mb-6 flex items-center gap-3">
            <Link
              to={backTo}
              className={
                showBrandHeader
                  ? "auth-back-button auth-back-button-brand"
                  : "auth-back-button"
              }
              aria-label="Volver"
            >
              <BackIcon className="h-6 w-6" />
            </Link>

            {showBrandHeader ? (
              <p className="text-2xl font-bold leading-none tracking-tight text-[var(--brand-red)]">
                ColaboraCar
              </p>
            ) : null}
          </div>

          {showLogo ? (
            <div className="mb-4">
              <BrandLogo bordered={showLogo === "bordered"} />
            </div>
          ) : null}

          <h1
            className={
              showBrandHeader
                ? "text-left text-[1.75rem] font-bold leading-tight text-[var(--text-primary)]"
                : "brand-title text-[var(--text-primary)]"
            }
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              className={
                showBrandHeader
                  ? "mt-1 text-sm text-[var(--text-brown)]"
                  : "auth-subtitle"
              }
            >
              {subtitle}
            </p>
          ) : null}

          <div className="mt-7">{children}</div>

          {footer}
        </div>
      </div>
    </div>
  );
}
