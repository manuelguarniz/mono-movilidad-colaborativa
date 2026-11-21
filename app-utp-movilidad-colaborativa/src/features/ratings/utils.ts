/** Etiquetas del puntaje (P20, «Decisión», ajuste 2). */
export const SCORE_LABEL: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

export const COMMENT_MAX = 200;

/** Primer nombre: «¿Cómo fue tu viaje con Carlos?». */
export const firstName = (name: string) => name.trim().split(/\s+/)[0];
