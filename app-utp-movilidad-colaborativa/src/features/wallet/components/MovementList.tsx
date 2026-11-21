import type { ReactNode } from "react";
import type { Movement, MovementType, WithdrawalStatus } from "@/features/wallet/types";
import {
  MOVEMENT_TITLE,
  formatMovementDay,
  limaDay,
  signedCredits,
} from "@/features/wallet/utils";
import { formatLimaTime } from "@/shared/utils/limaTime";
import ArrowUpIcon from "@/assets/images/icons/arrow-up.svg?react";
import PassengerIcon from "@/assets/images/icons/passenger.svg?react";
import RefundIcon from "@/assets/images/icons/refund.svg?react";
import RideIcon from "@/assets/images/icons/ride.svg?react";
import WalletIcon from "@/assets/images/icons/wallet.svg?react";

const GREEN = "bg-[var(--credit-green-soft)] text-[var(--credit-green)]";
const GRAY = "bg-[var(--surface-muted)] text-[var(--text-muted)]";
const RED = "bg-[var(--brand-soft)] text-[var(--brand-red)]";

const ICONS: Record<MovementType, { icon: ReactNode; tone: string }> = {
  RIDE_EARNING: { icon: <RideIcon className="h-5 w-5" />, tone: GREEN },
  TOP_UP: { icon: <WalletIcon className="h-5 w-5" />, tone: RED },
  BOOKING_HOLD: { icon: <PassengerIcon className="h-5 w-5" />, tone: GRAY },
  REFUND: { icon: <RefundIcon className="h-5 w-5" />, tone: GREEN },
  WITHDRAWAL: { icon: <ArrowUpIcon className="h-5 w-5" />, tone: GRAY },
  WITHDRAWAL_REVERSAL: { icon: <RefundIcon className="h-5 w-5" />, tone: GREEN },
};

// Etiquetas de la sección 2.3 del README.
const STATUS_CHIP: Record<WithdrawalStatus, { label: string; tone: string }> = {
  PENDING: {
    label: "En proceso",
    tone: "border border-[var(--amber-border)] bg-[var(--amber-soft)] text-[var(--amber-text)]",
  },
  PAID: { label: "Pagado", tone: GREEN },
  REJECTED: { label: "Rechazado", tone: RED },
};

function MovementRow({ movement }: { movement: Movement }) {
  const { icon, tone } = ICONS[movement.type];
  // El chip y el motivo van en la fila del retiro, no en la de su devolución.
  const withdrawal = movement.type === "WITHDRAWAL" ? movement.withdrawal : null;
  const chip = withdrawal ? STATUS_CHIP[withdrawal.status] : null;
  const isCredit = movement.amount > 0;

  return (
    <li className="wallet-movement">
      <span className={`wallet-movement-icon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {MOVEMENT_TITLE[movement.type]}
          </span>
          {chip ? <span className={`wallet-chip ${chip.tone}`}>{chip.label}</span> : null}
        </p>
        <p className="truncate text-sm text-[var(--text-muted)]" title={movement.description}>
          {movement.description}
        </p>
        {withdrawal?.status === "REJECTED" && withdrawal.rejectionReason ? (
          <p className="text-sm text-[var(--brand-red)]">{withdrawal.rejectionReason}</p>
        ) : null}
        <p className="text-sm text-[var(--text-muted)] tabular-nums">
          {formatLimaTime(new Date(movement.createdAt))}
        </p>
      </div>
      <span
        className={`shrink-0 text-lg font-bold tabular-nums ${
          isCredit ? "text-[var(--credit-green)]" : "text-[var(--text-primary)]"
        }`}
        aria-label={`${isCredit ? "Abono" : "Cargo"} de ${Math.abs(movement.amount)} créditos`}
      >
        {signedCredits(movement.amount)}
      </span>
    </li>
  );
}

/** Movimientos agrupados por día en la hora de Perú: «Hoy», «Ayer», «26 oct». */
export function MovementList({ movements }: { movements: Movement[] }) {
  const groups: { day: string; label: string; items: Movement[] }[] = [];
  for (const movement of movements) {
    const date = new Date(movement.createdAt);
    const day = limaDay(date);
    const last = groups[groups.length - 1];
    if (last?.day === day) {
      last.items.push(movement);
    } else {
      groups.push({ day, label: formatMovementDay(date), items: [movement] });
    }
  }

  return (
    <>
      {groups.map((group) => (
        <section key={group.day} aria-label={group.label}>
          <h3 className="wallet-day-label">{group.label}</h3>
          <ul className="wallet-movements">
            {group.items.map((movement) => (
              <MovementRow key={movement.id} movement={movement} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
