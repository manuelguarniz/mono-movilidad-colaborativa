import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/features/auth/components/BrandLogo";
import ChevronLeftIcon from "@/assets/images/icons/chevron-left.svg?react";

type AuthStepLayoutProps = {
  backTo: string;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  showLogoCard?: boolean;
  showBrandHeader?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthStepLayout({
  backTo,
  title,
  subtitle,
  showLogo = false,
  showLogoCard = false,
  showBrandHeader = false,
  children,
  footer,
}: AuthStepLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-content">
          <div className="mb-6 flex items-center">
            <Link
              to={backTo}
              className="auth-back-button"
              aria-label="Volver"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </Link>

            {showBrandHeader ? (
              <p className="flex-1 text-center text-2xl font-black tracking-tight text-[var(--brand-red)]">
                ColaboraCar
              </p>
            ) : (
              <span className="flex-1" />
            )}

            <span className="w-10" aria-hidden="true" />
          </div>

          {showLogoCard ? (
            <div className="auth-logo-card">
              <BrandLogo compact />
            </div>
          ) : showLogo ? (
            <div className="mb-8 flex justify-center">
              <BrandLogo compact />
            </div>
          ) : null}

          <h1
            className={
              showBrandHeader
                ? "mt-6 text-left text-3xl font-black leading-tight text-[#2f2a2a]"
                : "brand-title text-[#2f2a2a]"
            }
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              className={
                showBrandHeader
                  ? "mt-2 text-base text-[#7a6d6d]"
                  : "mt-3 text-center text-lg font-light leading-snug text-[#3a2f2f]"
              }
            >
              {subtitle}
            </p>
          ) : null}

          <div className="mt-8 flex flex-1 flex-col">{children}</div>

          {footer ? <div>{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
