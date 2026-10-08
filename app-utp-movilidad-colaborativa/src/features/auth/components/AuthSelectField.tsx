import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import ChevronDownIcon from "@/assets/images/icons/chevron-down.svg?react";

type AuthSelectFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  icon?: ReactNode;
  disabled?: boolean;
};

export function AuthSelectField({
  label,
  value,
  placeholder = "Seleccionar",
  options,
  onChange,
  icon,
  disabled,
}: AuthSelectFieldProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="auth-select-wrapper" ref={containerRef}>
      <label className="mb-2 block text-sm font-black uppercase tracking-wide text-[#3a2f2f]">
        {label}
      </label>

      <button
        type="button"
        className="auth-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {icon ? (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center text-[#d93a43]">
            {icon}
          </div>
        ) : null}

        <span
          className={
            selectedOption
              ? "auth-select-value text-[#2f2a2a]"
              : "auth-select-value auth-select-placeholder"
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-[#7a6d6d] transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <ul id={listboxId} className="auth-select-dropdown" role="listbox">
          {options.length === 0 ? (
            <li className="auth-select-empty">No hay opciones disponibles</li>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={
                      isSelected
                        ? "auth-select-option auth-select-option-active"
                        : "auth-select-option"
                    }
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
