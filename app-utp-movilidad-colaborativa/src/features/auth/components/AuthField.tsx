type AuthFieldProps = {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
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
  autoComplete,
  helperText,
  uppercaseLabel = true,
}: AuthFieldProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between gap-4">
        <label
          className={
            uppercaseLabel
              ? "text-sm font-black uppercase tracking-wide text-[#3a2f2f]"
              : "text-sm font-semibold text-[#6b5f5f]"
          }
        >
          {label}
        </label>
        {rightAction && type !== "password" ? rightAction : null}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border-[3px] border-[#d95a5f] bg-[#f5efef] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center text-[#9a8f8f]">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input-base text-base font-medium"
        />
        {rightAction && type === "password" ? (
          <div className="ml-auto">{rightAction}</div>
        ) : null}
      </div>

      {helperText ? (
        <p className="mt-2 text-sm leading-snug text-[#7a6d6d]">{helperText}</p>
      ) : null}
    </div>
  );
}
