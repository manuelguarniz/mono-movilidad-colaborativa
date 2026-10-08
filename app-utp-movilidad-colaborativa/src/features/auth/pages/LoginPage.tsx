import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { authService } from "@/features/auth/services/authService";
import MailIcon from "@/assets/images/icons/mail.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import EyeOffIcon from "@/assets/images/icons/eye-off.svg?react";
import EyeIcon from "@/assets/images/icons/eye.svg?react";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profileCompleted = Boolean(
    (location.state as { profileCompleted?: boolean } | null)?.profileCompleted,
  );
  const [email, setEmail] = useState("correo@ejemplo.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.login(email, password);
      navigate("/auth/verificacion");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="ColaboraCar"
      subtitle="Inicia sesión para continuar tu viaje."
      footer={
        <>
          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span>O</span>
            <span className="auth-divider-line" />
          </div>

          <Link to="/auth/register" className="auth-button-secondary">
            Registrarse
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {profileCompleted && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Perfil completado. Ya puedes iniciar sesión.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <AuthField
          label="Correo electrónico"
          type="email"
          value={email}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          onChange={setEmail}
          icon={<MailIcon className="h-6 w-6" />}
        />

        <div className="mb-4 flex items-center justify-between gap-4">
          <label className="text-sm font-black uppercase tracking-wide text-[#3a2f2f]">
            Contraseña
          </label>
          <button
            type="button"
            className="text-sm font-black text-[#d93a43] transition hover:text-[#c12c33]"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <AuthField
          label=""
          type={showPassword ? "text" : "password"}
          value={password}
          placeholder="••••••••"
          autoComplete="current-password"
          onChange={setPassword}
          icon={<LockIcon className="h-6 w-6" />}
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center text-[#2b2b2b]"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOffIcon className="h-7 w-7" />
              ) : (
                <EyeIcon className="h-7 w-7" />
              )}
            </button>
          }
        />

        <button
          type="submit"
          className="auth-button-primary"
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>
    </AuthLayout>
  );
}
