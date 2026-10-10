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
  const { profileCompleted, sessionExpired } =
    (location.state as {
      profileCompleted?: boolean;
      sessionExpired?: boolean;
    } | null) ?? {};
  // Cuenta de prueba de la API simulada (ver src/mocks/db.ts).
  const [email, setEmail] = useState("valeria.rodriguez@utp.edu.pe");
  const [password, setPassword] = useState("Clave#2026");
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
          <div className="auth-message auth-message-success">
            Perfil completado. Ya puedes iniciar sesión.
          </div>
        )}

        {sessionExpired && !error && (
          <div className="auth-message auth-message-error">
            Tu sesión expiró. Vuelve a iniciar sesión.
          </div>
        )}

        {error && (
          <div className="auth-message auth-message-error">
            {error}
          </div>
        )}

        <AuthField
          label="Correo electrónico"
          type="email"
          value={email}
          placeholder="correo@utp.edu.pe"
          autoComplete="email"
          uppercaseLabel
          onChange={setEmail}
          icon={<MailIcon className="h-6 w-6" />}
        />

        <AuthField
          label="Contraseña"
          uppercaseLabel
          labelAction={
            <button type="button" className="auth-label-action">
              ¿Olvidaste tu contraseña?
            </button>
          }
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
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--text-brown)]"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOffIcon className="h-6 w-6" />
              ) : (
                <EyeIcon className="h-6 w-6" />
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
