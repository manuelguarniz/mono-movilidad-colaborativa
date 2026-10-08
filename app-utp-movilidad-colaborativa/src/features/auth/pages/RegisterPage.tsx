import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthField } from "@/features/auth/components/AuthField";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { authService } from "@/features/auth/services/authService";
import EyeOffIcon from "@/assets/images/icons/eye-off.svg?react";
import EyeIcon from "@/assets/images/icons/eye.svg?react";
import MailIcon from "@/assets/images/icons/mail.svg?react";
import LockIcon from "@/assets/images/icons/lock.svg?react";
import LockConfirmIcon from "@/assets/images/icons/lock-confirm.svg?react";

const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-8 w-8 items-center justify-center text-[#6b5f5f]"
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {visible ? (
        <EyeOffIcon className="h-6 w-6" />
      ) : (
        <EyeIcon className="h-6 w-6" />
      )}
    </button>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    if (!PASSWORD_PATTERN.test(form.password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres con letras, números y símbolos",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.register({
        email: form.email,
        password: form.password,
      });
      navigate("/auth/completar-perfil");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthStepLayout
      backTo="/auth/login"
      title="Registro"
      showLogoCard
      footer={
        <p className="mt-8 text-center text-base font-medium text-[#4b3d3d]">
          ¿Ya tienes una cuenta?{" "}
          <Link
            to="/auth/login"
            className="font-black text-[#d93a43] hover:text-[#c12c33]"
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <AuthField
          label="Email"
          type="email"
          value={form.email}
          placeholder="tu@email.com"
          autoComplete="email"
          uppercaseLabel={false}
          onChange={(value) => handleChange("email", value)}
          icon={
            <MailIcon className="h-6 w-6" />
          }
        />

        <AuthField
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          value={form.password}
          placeholder="••••••••"
          autoComplete="new-password"
          uppercaseLabel={false}
          helperText="Usa al menos 8 caracteres con una mezcla de letras, números y símbolos."
          onChange={(value) => handleChange("password", value)}
          icon={
            <LockIcon className="h-6 w-6" />
          }
          rightAction={
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
            />
          }
        />

        <AuthField
          label="Repetir contraseña"
          type={showConfirmPassword ? "text" : "password"}
          value={form.confirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
          uppercaseLabel={false}
          onChange={(value) => handleChange("confirmPassword", value)}
          icon={
            <LockConfirmIcon className="h-6 w-6" />
          }
          rightAction={
            <PasswordVisibilityToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
            />
          }
        />

        <label className="auth-terms-option">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="auth-terms-checkbox"
          />
          <span className="text-sm font-medium text-[#4b3d3d]">
            Acepto los términos y condiciones
          </span>
        </label>

        <button
          type="submit"
          className="auth-button-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Continuando..." : "Continuar"}
        </button>
      </form>
    </AuthStepLayout>
  );
}
