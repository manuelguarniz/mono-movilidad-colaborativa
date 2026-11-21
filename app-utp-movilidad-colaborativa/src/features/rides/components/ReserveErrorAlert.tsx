import { Link } from "react-router-dom";
import { ApiError } from "@/shared/api/apiClient";
import { errorMessage } from "@/features/my-rides/utils";

type ReserveErrorAlertProps = {
  error: unknown;
  /** Pantalla a la que vuelve «Listo» después de recargar. */
  returnTo: string;
  className?: string;
};

/**
 * Error al reservar. Con saldo insuficiente (RN-39) suma el botón «Recargar», que abre la
 * billetera con la recarga (21-C) ya abierta.
 */
export function ReserveErrorAlert({ error, returnTo, className = "dashboard-alert" }: ReserveErrorAlertProps) {
  const needsCredits = error instanceof ApiError && error.code === "INSUFFICIENT_CREDITS";
  return (
    <div className={`${className} flex items-center justify-between gap-3`} role="alert">
      <p>{errorMessage(error)}</p>
      {needsCredits ? (
        <Link
          to={`/billetera?recargar=1&volver=${encodeURIComponent(returnTo)}`}
          className="my-rides-soft-button h-10 shrink-0 px-4"
        >
          Recargar
        </Link>
      ) : null}
    </div>
  );
}
