import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import { SheetHeader } from "@/features/wallet/components/SheetHeader";
import { walletService } from "@/features/wallet/services/walletService";
import type { TopUpResult, Wallet } from "@/features/wallet/types";
import { ApiError } from "@/shared/api/apiClient";
import { GoldCoinIcon } from "@/shared/icons";
import { errorMessage, plural } from "@/features/my-rides/utils";
import { formatDepartureLabel } from "@/shared/utils/limaTime";
import CheckIcon from "@/assets/images/icons/check.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import QrIcon from "@/assets/images/icons/qr-code.svg?react";

const PRESETS = [10, 20, 50];
const DEFAULT_AMOUNT = 20;

type TopUpSheetProps = {
  limits: Wallet["limits"];
  onClose: () => void;
  /** «Listo» tras la recarga (21-D). */
  onDone: () => void;
};

type FieldErrors = { amount?: string; operationCode?: string };

/** «Recargar créditos» (21-C) y «Recargaste N créditos» (21-D). Recarga simulada (RN-41). */
export function TopUpSheet({ limits, onClose, onDone }: TopUpSheetProps) {
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState<number | "other">(DEFAULT_AMOUNT);
  const [otherAmount, setOtherAmount] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<TopUpResult | null>(null);

  const amount = preset === "other" ? Number(otherAmount || NaN) : preset;
  const hasAmount = Number.isInteger(amount) && amount > 0;
  const amountMessage = `Elige un monto entre S/ ${limits.topUpMin} y S/ ${limits.topUpMax}.`;

  const mutation = useMutation({
    mutationFn: () => walletService.topUp(amount, code),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors.length) {
        setFieldErrors(
          Object.fromEntries(error.fieldErrors.map((item) => [item.field, item.message])),
        );
      } else if (error instanceof ApiError && error.code === "OPERATION_CODE_ALREADY_USED") {
        setFieldErrors({ operationCode: error.message });
      }
    },
  });
  const isBusy = mutation.isPending;
  // Los errores de campo van debajo de cada campo; el resto, en la franja sobre el botón.
  const generalError =
    mutation.isError &&
    !(mutation.error instanceof ApiError &&
      (mutation.error.fieldErrors.length || mutation.error.code === "OPERATION_CODE_ALREADY_USED"))
      ? errorMessage(mutation.error)
      : null;

  const submit = () => {
    const errors: FieldErrors = {};
    if (!hasAmount || amount < limits.topUpMin || amount > limits.topUpMax) {
      errors.amount = amountMessage;
    }
    if (!/^\d{6,12}$/.test(code)) {
      errors.operationCode = "El código de operación tiene de 6 a 12 dígitos.";
    }
    setFieldErrors(errors);
    if (!errors.amount && !errors.operationCode) {
      mutation.mutate();
    }
  };

  if (result) {
    return (
      <ConfirmSheet
        titleId="top-up-done-title"
        isBusy={false}
        error={null}
        onClose={onDone}
        actions={
          <button type="button" className="publish-submit" onClick={onDone}>
            Listo
          </button>
        }
      >
        <div className="my-rides-sheet-icon mt-5 bg-[var(--credit-green-soft)] text-[var(--credit-green)]">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h2
          id="top-up-done-title"
          className="mt-4 text-center text-[1.375rem] font-semibold text-[var(--text-primary)]"
        >
          Recargaste {plural(result.credits, "crédito", "créditos")}
        </h2>
        <div className="mt-5 rounded-xl bg-[var(--surface-muted)] px-4 py-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">Nuevo saldo disponible</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            <GoldCoinIcon className="h-7 w-7" />
            {plural(result.balance, "crédito", "créditos")}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)] tabular-nums">
            Operación {result.operationCode} · {formatDepartureLabel(new Date(result.createdAt))}
          </p>
        </div>
      </ConfirmSheet>
    );
  }

  return (
    <ConfirmSheet
      titleId="top-up-title"
      isBusy={isBusy}
      error={generalError}
      onClose={onClose}
      actions={
        <button type="button" className="publish-submit" disabled={isBusy} onClick={submit}>
          {isBusy
            ? "Recargando..."
            : hasAmount
              ? `Recargar ${plural(amount, "crédito", "créditos")}`
              : "Recargar"}
        </button>
      }
    >
      <SheetHeader titleId="top-up-title" title="Recargar créditos" disabled={isBusy} onClose={onClose} />

      <p className="wallet-amber mt-4" role="note">
        <InfoIcon className="mt-0.5 h-5 w-5 shrink-0" />
        Modo de prueba: el código no se verifica con Yape
      </p>

      <p className="wallet-step-label" id="top-up-amount-label">
        1. Elige el monto
      </p>
      <div className="flex gap-2" role="group" aria-labelledby="top-up-amount-label">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className="wallet-amount-chip"
            aria-pressed={preset === value}
            disabled={isBusy}
            onClick={() => {
              setPreset(value);
              setFieldErrors((current) => ({ ...current, amount: undefined }));
            }}
          >
            S/&nbsp;{value}
          </button>
        ))}
        <button
          type="button"
          className="wallet-amount-chip"
          aria-pressed={preset === "other"}
          disabled={isBusy}
          onClick={() => setPreset("other")}
        >
          Otro
        </button>
      </div>
      {preset === "other" ? (
        <div className={`wallet-input mt-3 ${fieldErrors.amount ? "wallet-input-invalid" : ""}`}>
          <span className="text-lg text-[var(--text-muted)]">S/</span>
          <input
            inputMode="numeric"
            autoFocus
            aria-label="Monto en soles"
            aria-invalid={Boolean(fieldErrors.amount)}
            aria-describedby="top-up-amount-help"
            placeholder={`De ${limits.topUpMin} a ${limits.topUpMax}`}
            value={otherAmount}
            disabled={isBusy}
            onChange={(event) => {
              setOtherAmount(event.target.value.replace(/\D/g, "").slice(0, 3));
              setFieldErrors((current) => ({ ...current, amount: undefined }));
            }}
          />
        </div>
      ) : null}
      <p
        id="top-up-amount-help"
        className={fieldErrors.amount ? "publish-field-error text-sm" : "wallet-help"}
      >
        {fieldErrors.amount ??
          `${hasAmount ? `Recibirás ${plural(amount, "crédito", "créditos")}. ` : ""}Mínimo S/ ${limits.topUpMin}, máximo S/ ${limits.topUpMax}.`}
      </p>

      <p className="wallet-step-label">2. Yapea</p>
      <p className="flex items-start gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-[0.9375rem] text-[var(--text-primary)]">
        <QrIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        <span>
          Yapea <strong>S/&nbsp;{hasAmount ? amount : "N"}</strong> y escribe el código de operación
          que te muestra Yape
        </span>
      </p>

      <label className="wallet-step-label block" htmlFor="top-up-code">
        3. Código de operación
      </label>
      <div className={`wallet-input ${fieldErrors.operationCode ? "wallet-input-invalid" : ""}`}>
        <input
          id="top-up-code"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ej. 08451236"
          aria-invalid={Boolean(fieldErrors.operationCode)}
          aria-describedby="top-up-code-help"
          value={code}
          disabled={isBusy}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 12));
            setFieldErrors((current) => ({ ...current, operationCode: undefined }));
          }}
        />
      </div>
      <p
        id="top-up-code-help"
        className={fieldErrors.operationCode ? "publish-field-error text-sm" : "wallet-help"}
      >
        {fieldErrors.operationCode ?? "De 6 a 12 dígitos"}
      </p>
    </ConfirmSheet>
  );
}
