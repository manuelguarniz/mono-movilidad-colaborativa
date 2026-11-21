import StarIcon from "@/assets/images/icons/star.svg?react";

type StarsProps = { score: number; className?: string };

/** Puntaje de solo lectura: estrellas llenas en ámbar y vacías en contorno gris. */
export function Stars({ score, className = "h-4 w-4" }: StarsProps) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${score} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <StarIcon
          key={value}
          aria-hidden="true"
          className={`${className} ${value <= score ? "fill-current text-[#f59e0b]" : "text-[#c9c9c9]"}`}
        />
      ))}
    </span>
  );
}

type StarInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  labelledBy?: string;
};

/** Selector de 1 a 5 estrellas enteras (RN-47), con área táctil de 48 px. */
export function StarInput({ value, onChange, disabled = false, labelledBy }: StarInputProps) {
  return (
    <div
      className={`flex justify-center gap-1 ${disabled ? "opacity-40" : ""}`}
      role="radiogroup"
      aria-labelledby={labelledBy}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star <= value}
          aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
          className="rate-star"
          disabled={disabled}
          onClick={() => onChange(star)}
        >
          <StarIcon aria-hidden="true" className={`h-10 w-10 ${star <= value ? "fill-current" : ""}`} />
        </button>
      ))}
    </div>
  );
}
