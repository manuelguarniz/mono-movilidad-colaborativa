import type { HTMLAttributes, ReactNode } from "react";

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
}: AuthFieldProps) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 flex items-center justify-between gap-4">
        <span className={uppercaseLabel ? "auth-label-uppercase" : "auth-label"}>
          {label}
          {required ? (
            <span className="text-[var(--brand-red)]" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </span>
        {labelAction}
      </span>

      <span className={disabled ? "auth-input auth-input-disabled" : "auth-input"}>
        {icon ? <span className="auth-input-icon">{icon}</span> : null}
        {prefix ? (
          <span className="shrink-0 border-r border-[var(--border-neutral)] pr-3 text-base font-medium text-[var(--text-primary)]">
            {prefix}
          </span>
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          disabled={disabled}
          className="input-base"
        />
        {rightAction}
      </span>

      {helperText ? (
        <span className="auth-helper-text block">{helperText}</span>
      ) : null}
    </label>
  );
}
