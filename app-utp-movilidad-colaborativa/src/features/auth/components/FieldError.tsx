import type { ReactNode } from "react";
import AlertIcon from "@/assets/images/icons/alert-circle.svg?react";

/** Mensaje de validación debajo de un campo: rojo y con ícono de alerta (frames 15-C y 16-B). */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <span id={id} className="field-error" role="alert">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
