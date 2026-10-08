import { useRef } from "react";

type OtpInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

const OTP_LENGTH = 6;

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const updateDigit = (index: number, digit: string) => {
    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    updateDigit(index, digit);
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    const next = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? "");
    onChange(next);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="otp-input-grid">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          className={`otp-input-box ${digit || index === 0 ? "otp-input-box-active" : ""}`}
          aria-label={`Dígito ${index + 1} del código`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
