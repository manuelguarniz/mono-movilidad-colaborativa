type AuthFieldProps = {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  // Acción dentro del campo, a la derecha (por ejemplo, mostrar la contraseña).
  rightAction?: React.ReactNode;
  // Acción a la derecha de la etiqueta (por ejemplo, «¿Olvidaste tu contraseña?»).
  labelAction?: React.ReactNode;
  autoComplete?: string;
  helperText?: string;
  uppercaseLabel?: boolean;
};

export function AuthField({
  label,
  type = "text",
  value,
  placeholder,
  onChange,
  icon,
  rightAction,
  labelAction,
  autoComplete,
  helperText,
  uppercaseLabel = false,
}: AuthFieldProps) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 flex items-center justify-between gap-4">
        <span className={uppercaseLabel ? "auth-label-uppercase" : "auth-label"}>
          {label}
        </span>
        {labelAction}
      </span>

      <span className="auth-input">
        {icon ? <span className="auth-input-icon">{icon}</span> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
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
