import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthStepLayout } from "@/features/auth/components/AuthStepLayout";
import { OtpInput } from "@/features/auth/components/OtpInput";
import { authService } from "@/features/auth/services/authService";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;
const MAX_ATTEMPTS = 3;

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function VerificationPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/auth/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const code = digits.join("");
  const canResend = secondsLeft <= 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (code.length !== OTP_LENGTH) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setError("Has superado el máximo de intentos permitidos");
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.verifyCode(code);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError(
        err instanceof Error ? err.message : "No se pudo verificar el código",
      );
      setDigits(Array(OTP_LENGTH).fill(""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) {
      return;
    }

    setIsResending(true);
    setError("");

    try {
      await authService.resendCode();
      setSecondsLeft(RESEND_SECONDS);
      setAttempts(0);
      setDigits(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo reenviar el código",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthStepLayout
      backTo="/auth/login"
      title="Verificación"
      subtitle="Ingresa el código de 6 dígitos enviado a tu correo"
      showLogo
    >
      <form onSubmit={handleSubmit}>
        <OtpInput value={digits} onChange={setDigits} disabled={isSubmitting} />

        <p className="mt-3 text-center text-sm font-semibold text-[#d93a43]">
          Máximo 3 intentos permitidos
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="auth-button-primary"
          disabled={isSubmitting || attempts >= MAX_ATTEMPTS}
        >
          {isSubmitting ? "Verificando..." : "Continuar"}
        </button>
      </form>

      <div className="mt-auto pt-10 text-center">
        <p className="text-sm text-[#7a6d6d]">
          {canResend
            ? "Ya puedes solicitar un nuevo código"
            : `Reenviar código en ${formatTimer(secondsLeft)}`}
        </p>

        <button
          type="button"
          className="mt-2 text-base font-black text-[#d93a43] disabled:opacity-50"
          onClick={handleResend}
          disabled={!canResend || isResending}
        >
          {isResending ? "Reenviando..." : "Reenviar código"}
        </button>
      </div>
    </AuthStepLayout>
  );
}
