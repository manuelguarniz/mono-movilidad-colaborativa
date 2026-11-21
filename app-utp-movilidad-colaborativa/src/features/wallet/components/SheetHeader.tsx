import CloseIcon from "@/assets/images/icons/close.svg?react";

type SheetHeaderProps = {
  titleId: string;
  title: string;
  disabled: boolean;
  onClose: () => void;
};

/** Título de las hojas de la billetera con la «X» para cerrar (21-C, 21-E). */
export function SheetHeader({ titleId, title, disabled, onClose }: SheetHeaderProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <h2 id={titleId} className="text-[1.5rem] font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      <button
        type="button"
        className="publish-icon-button h-10 w-10"
        aria-label="Cerrar"
        disabled={disabled}
        onClick={onClose}
      >
        <CloseIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
