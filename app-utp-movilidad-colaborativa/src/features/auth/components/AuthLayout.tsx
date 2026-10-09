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
        <div className="auth-content justify-center py-6">
          <BrandLogo />

          <h1 className="brand-title mt-4">{title}</h1>

          {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}

          <div className="mt-8">{children}</div>

          {footer}
        </div>
      </div>
    </div>
  );
}
