import type { ReactNode } from "react";
import { BrandLogo } from "@/features/auth/components/BrandLogo";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-content">
          <div className="mb-4 flex justify-center">
            <BrandLogo compact />
          </div>

          <h1 className="brand-title">{title}</h1>

          {subtitle ? (
            <p className="mt-3 text-center text-lg font-light leading-snug text-[#3a2f2f]">
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
