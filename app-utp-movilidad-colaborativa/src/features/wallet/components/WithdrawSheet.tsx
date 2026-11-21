import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmSheet } from "@/features/my-rides/components/ConfirmSheet";
import { SheetHeader } from "@/features/wallet/components/SheetHeader";
import { walletService } from "@/features/wallet/services/walletService";
import type { Wallet } from "@/features/wallet/types";
import { formatPhone } from "@/features/wallet/utils";
import { ApiError } from "@/shared/api/apiClient";
import { GoldCoinIcon } from "@/shared/icons";
import { errorMessage, plural } from "@/features/my-rides/utils";
import ClockIcon from "@/assets/images/icons/clock.svg?react";

type WithdrawSheetProps = {
  wallet: Wallet;
  onClose: () => void;
  onRequested: () => void;
};

type FieldErrors = { amount?: string; yapePhone?: string };

/** «Retirar a Yape» (21-E, RN-42). Al solicitarlo se descuentan los créditos. */
export function WithdrawSheet({ wallet, onClose, onRequested }: WithdrawSheetProps) {
  const queryClient = useQueryClient();
  const { withdrawable, limits } = wallet;
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(wallet.lastYapePhone ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const credits = Number(amount || NaN);
  const hasAmount = Number.isInteger(credits) && credits > 0;

  const mutation = useMutation({
    mutationFn: () => walletService.withdraw(credits, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      onRequested();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors.length) {
        setFieldErrors(
          Object.fromEntries(error.fieldErrors.map((item) => [item.field, item.message])),
        );
      }
    },
  });
  const isBusy = mutation.isPending;
  const generalError =
    mutation.isError && !(mutation.error instanceof ApiError && mutation.error.fieldErrors.length)
      ? errorMessage(mutation.error)
      : null;

  const submit = () => {
    const errors: FieldErrors = {};
    if (!hasAmount || credits < limits.withdrawalMin) {
      errors.amount = `El retiro mínimo es de ${limits.withdrawalMin} créditos.`;
    } else if (credits > withdrawable) {
      errors.amount = `Solo puedes retirar hasta ${withdrawable} créditos (lo que ganaste como conductor)`;
    }
    if (!/^9\d{8}$/.test(phone)) {
      errors.yapePhone = "Ingresa un celular de 9 dígitos que empiece con 9.";
    }
    setFieldErrors(errors);
    if (!errors.amount && !errors.yapePhone) {
      mutation.mutate();
    }
  };

  return (
    <ConfirmSheet
      titleId="withdraw-title"
      isBusy={isBusy}
      error={generalError}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="publish-submit" disabled={isBusy} onClick={submit}>
            {isBusy
              ? "Solicitando..."
              : hasAmount
                ? `Solicitar retiro de ${plural(credits, "crédito", "créditos")}`
                : "Solicitar retiro"}
          </button>
          <button
            type="button"
            className="publish-secondary-button mt-0"
            disabled={isBusy}
            onClick={onClose}
          >
            Cancelar
          </button>
        </>
      }
    >
      <SheetHeader titleId="withdraw-title" title="Retirar a Yape" disabled={isBusy} onClose={onClose} />

      <div className="mt-4 rounded-xl bg-[var(--surface-muted)] px-4 py-4">
        <p className="text-sm text-[var(--text-muted)]">Puedes retirar</p>
        <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)] tabular-nums">
          <GoldCoinIcon className="h-7 w-7" />
          {plural(withdrawable, "crédito", "créditos")}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Solo lo que ganaste como conductor. 1&nbsp;crédito&nbsp;=&nbsp;S/&nbsp;1.
        </p>
      </div>

      <label className="mb-1.5 mt-4 block text-[0.9375rem] font-medium text-[var(--text-primary)]" htmlFor="withdraw-amount">
        Monto
      </label>
      <div className={`wallet-input ${fieldErrors.amount ? "wallet-input-invalid" : ""}`}>
        <input
          id="withdraw-amount"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={Boolean(fieldErrors.amount)}
          aria-describedby="withdraw-amount-help"
          value={amount}
          disabled={isBusy}
          onChange={(event) => {
            setAmount(event.target.value.replace(/\D/g, "").slice(0, 4));
            setFieldErrors((current) => ({ ...current, amount: undefined }));
          }}
          className="!flex-none"
          style={{ width: `${Math.max(2, amount.length + 1)}ch` }}
        />
        <span className="flex-1 text-base text-[var(--text-muted)]">créditos</span>
        <button
          type="button"
          className="shrink-0 text-[0.9375rem] font-semibold text-[var(--brand-red)] disabled:opacity-50"
          disabled={isBusy || withdrawable === 0}
          onClick={() => {
            setAmount(String(withdrawable));
            setFieldErrors((current) => ({ ...current, amount: undefined }));
          }}
        >
          Retirar todo
        </button>
      </div>
      <p
        id="withdraw-amount-help"
        className={fieldErrors.amount ? "publish-field-error text-sm" : "wallet-help"}
      >
        {fieldErrors.amount ?? `Mínimo ${limits.withdrawalMin} créditos`}
      </p>

      <label className="mb-1.5 mt-4 block text-[0.9375rem] font-medium text-[var(--text-primary)]" htmlFor="withdraw-phone">
        Celular de Yape
      </label>
      <div className={`wallet-input ${fieldErrors.yapePhone ? "wallet-input-invalid" : ""}`}>
        <input
          id="withdraw-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="987 654 321"
          aria-invalid={Boolean(fieldErrors.yapePhone)}
          aria-describedby="withdraw-phone-help"
          value={formatPhone(phone)}
          disabled={isBusy}
          onChange={(event) => {
            setPhone(event.target.value.replace(/\D/g, "").slice(0, 9));
            setFieldErrors((current) => ({ ...current, yapePhone: undefined }));
          }}
        />
      </div>
      <p
        id="withdraw-phone-help"
        className={fieldErrors.yapePhone ? "publish-field-error text-sm" : "wallet-help"}
      >
        {fieldErrors.yapePhone ?? "9 dígitos, empieza con 9"}
      </p>

      <p className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--border-neutral)] bg-[#f6f6f6] px-4 py-3 text-[0.9375rem] text-[var(--text-muted)]">
        <ClockIcon className="mt-0.5 h-5 w-5 shrink-0" />
        Descontamos los créditos ahora. Un operador te yapea y verás el retiro como «En proceso»
        hasta que se pague.
      </p>
    </ConfirmSheet>
  );
}
