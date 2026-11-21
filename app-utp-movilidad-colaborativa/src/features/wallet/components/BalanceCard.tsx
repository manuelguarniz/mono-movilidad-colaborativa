import type { Wallet } from "@/features/wallet/types";
import { plural } from "@/features/my-rides/utils";
import { GoldCoinIcon } from "@/shared/icons";
import { formatLimaTime, getLimaDayLabel } from "@/shared/utils/limaTime";
import ArrowUpIcon from "@/assets/images/icons/arrow-up.svg?react";
import InfoIcon from "@/assets/images/icons/info.svg?react";
import PlusIcon from "@/assets/images/icons/plus.svg?react";

export const WITHDRAW_BLOCKED_ID = "wallet-withdraw-blocked";

type BalanceCardProps = {
  wallet: Wallet;
  onTopUp: () => void;
  onWithdraw: () => void;
};

/**
 * Tarjeta de saldo (21-A, 21-B, 21-F). En modo conductor muestra «Retirable» y «Retirar»; en
 * modo pasajero solo lo retenido, con la reserva que lo explica.
 */
export function BalanceCard({ wallet, onTopUp, onWithdraw }: BalanceCardProps) {
  const isDriverMode = wallet.activeMode === "DRIVER";
  const hasPending = Boolean(wallet.pendingWithdrawal);
  const booking = wallet.heldBooking;

  return (
    <section className="wallet-balance-card" aria-labelledby="wallet-balance-label">
      <p id="wallet-balance-label" className="publish-label">
        Saldo disponible
      </p>
      <p className="mt-2 flex items-center gap-3">
        <GoldCoinIcon className="h-11 w-11 shrink-0" />
        <span className="wallet-amount">{wallet.available}</span>
        <span className="self-end pb-0.5 text-xl text-[var(--text-muted)]">
          {wallet.available === 1 ? "crédito" : "créditos"}
        </span>
      </p>

      {isDriverMode ? (
        <div className="wallet-breakdown grid-cols-2">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Retenido</p>
            <p className="wallet-breakdown-value">{plural(wallet.held, "crédito", "créditos")}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
              Retirable
              <span
                role="img"
                aria-label="Solo lo que ganaste como conductor"
                title="Solo lo que ganaste como conductor"
              >
                <InfoIcon className="h-4 w-4" aria-hidden="true" />
              </span>
            </p>
            <p className="wallet-breakdown-value">
              {plural(wallet.withdrawable, "crédito", "créditos")}
            </p>
          </div>
        </div>
      ) : (
        <div className="wallet-breakdown">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Retenido</p>
            <p className="wallet-breakdown-value">{plural(wallet.held, "crédito", "créditos")}</p>
            {booking ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                En tu reserva de {getLimaDayLabel(new Date(booking.departureTime))},{" "}
                {formatLimaTime(new Date(booking.departureTime))}. Se cobra al terminar el viaje.
              </p>
            ) : wallet.held > 0 ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">Se cobra al terminar el viaje.</p>
            ) : null}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button type="button" className="wallet-action wallet-action-primary" onClick={onTopUp}>
          <PlusIcon className="h-5 w-5" />
          Recargar
        </button>
        {isDriverMode ? (
          <button
            type="button"
            className="wallet-action wallet-action-secondary"
            aria-disabled={hasPending}
            aria-describedby={hasPending ? WITHDRAW_BLOCKED_ID : undefined}
            onClick={() => {
              if (!hasPending) {
                onWithdraw();
              }
            }}
          >
            <ArrowUpIcon className="h-5 w-5" />
            Retirar
          </button>
        ) : null}
      </div>
      {isDriverMode && hasPending ? (
        <p id={WITHDRAW_BLOCKED_ID} className="mt-3 text-center text-sm text-[var(--text-muted)]">
          Ya tienes un retiro pendiente
        </p>
      ) : null}
    </section>
  );
}
