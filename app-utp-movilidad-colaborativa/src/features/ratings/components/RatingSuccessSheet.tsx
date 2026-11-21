import { Stars } from "@/features/ratings/components/Stars";
import { SCORE_LABEL } from "@/features/ratings/utils";
import CheckIcon from "@/assets/images/icons/check.svg?react";

type RatingSuccessSheetProps = {
  message: string;
  // Solo cuando se calificó a una persona (pasajero): sus estrellas y su comentario.
  score?: number;
  comment?: string | null;
  onDone: () => void;
};

/** «¡Gracias por calificar!» (20-C), sobre la pantalla con el velo a todo el ancho. */
export function RatingSuccessSheet({ message, score, comment, onDone }: RatingSuccessSheetProps) {
  return (
    <div className="app-sheet-backdrop">
      <section className="app-sheet text-center" role="dialog" aria-modal="true" aria-labelledby="rating-done-title">
        <div className="publish-sheet-handle" />
        <div className="my-rides-sheet-icon mt-5 bg-[var(--credit-green-soft)] text-[var(--credit-green)]">
          <CheckIcon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 id="rating-done-title" className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          ¡Gracias por calificar!
        </h2>
        <p className="mt-1 text-[0.9375rem] text-[var(--text-brown)]">{message}</p>
        {score ? (
          <div className="mt-4 rounded-xl bg-[var(--surface-muted)] px-4 py-4">
            <Stars score={score} className="h-6 w-6" />
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{SCORE_LABEL[score]}</p>
            {comment ? <p className="mt-1 text-sm italic text-[var(--text-muted)]">«{comment}»</p> : null}
          </div>
        ) : null}
        <button type="button" className="publish-submit mt-5" onClick={onDone} autoFocus>
          Listo
        </button>
      </section>
    </div>
  );
}
