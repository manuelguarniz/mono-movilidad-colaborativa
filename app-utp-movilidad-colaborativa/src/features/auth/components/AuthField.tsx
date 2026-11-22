import { useId, type HTMLAttributes, type ReactNode } from "react";
import { FieldError } from "@/features/auth/components/FieldError";

type AuthFieldProps = {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  // Texto fijo antes del valor (por ejemplo, el prefijo «+51»).
  prefix?: ReactNode;
  // Acción dentro del campo, a la derecha (por ejemplo, mostrar la contraseña).
  rightAction?: ReactNode;
  // Acción a la derecha de la etiqueta (por ejemplo, «¿Olvidaste tu contraseña?»).
  labelAction?: ReactNode;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  helperText?: string;
  uppercaseLabel?: boolean;
  // Muestra el asterisco de campo obligatorio.
  required?: boolean;
  // Campo de solo lectura: se muestra atenuado.
  disabled?: boolean;
  // Mensaje de validación: borde rojo y el texto debajo del campo. Un espacio (" ") marca el
  // campo sin texto propio, cuando el mensaje va en una franja de la sección (16-B).
  error?: string;
  // Atributos del input, por ejemplo `type="date"` con `min` y `max`.
  min?: string;
  max?: string;
};

export function AuthField({
  label,
  type = "text",
  value,
  placeholder,
  onChange,
  icon,
  prefix,
  rightAction,
  labelAction,
  autoComplete,
  inputMode,
  maxLength,
  helperText,
  uppercaseLabel = false,
  required = false,
  disabled = false,
  error,
  min,
  max,
}: AuthFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const helperId = useId();
  const describedBy =
    [error?.trim() ? errorId : null, helperText ? helperId : null].filter(Boolean).join(" ") ||
    undefined;
  // El error y la ayuda quedan fuera de la etiqueta: así no forman parte del nombre del campo.
  return (
    <div className="mb-5 block">
      <span className="mb-2 flex items-center justify-between gap-4">
        <label
          htmlFor={inputId}
          className={uppercaseLabel ? "auth-label-uppercase" : "auth-label"}
        >
          {label}
          {required ? (
            <span className="text-[var(--brand-red)]" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
        {labelAction}
      </span>

      <span
        className={`auth-input${disabled ? " auth-input-disabled" : ""}${error ? " auth-input-error" : ""}`}
      >
        {icon ? <span className="auth-input-icon">{icon}</span> : null}
        {prefix ? (
          <span className="shrink-0 border-r border-[var(--border-neutral)] pr-3 text-base font-medium text-[var(--text-primary)]">
            {prefix}
          </span>
        ) : null}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          disabled={disabled}
          min={min}
          max={max}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="input-base"
        />
        {rightAction}
      </span>

      {error?.trim() ? <FieldError id={errorId}>{error}</FieldError> : null}

      {helperText ? (
        <span id={helperId} className="auth-helper-text block">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
