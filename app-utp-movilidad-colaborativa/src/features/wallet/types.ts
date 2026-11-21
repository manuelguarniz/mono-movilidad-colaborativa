// Contrato de la billetera (P21): `GET /wallet`, `GET /wallet/movements`,
// `POST /wallet/top-ups` y `POST /wallet/withdrawals`.

export type MovementType =
  | "TOP_UP"
  | "BOOKING_HOLD"
  | "REFUND"
  | "RIDE_EARNING"
  | "WITHDRAWAL"
  | "WITHDRAWAL_REVERSAL";

export type WithdrawalStatus = "PENDING" | "PAID" | "REJECTED";

export type Wallet = {
  available: number;
  held: number;
  /** Saldo retirable de RN-42: mín(disponible, lo ganado como conductor − lo retirado). */
  withdrawable: number;
  activeMode: "PASSENGER" | "DRIVER";
  driver: boolean;
  /** Reserva activa que explica lo retenido (21-B). */
  heldBooking: {
    id: string;
    rideId: string;
    departureTime: string;
    origin: string;
    destination: string;
    credits: number;
  } | null;
  /** Retiro en proceso (21-F). */
  pendingWithdrawal: {
    id: string;
    credits: number;
    phoneLast3: string;
    requestedAt: string;
  } | null;
  /** Celular del último retiro, para precargar el formulario. */
  lastYapePhone: string | null;
  limits: { topUpMin: number; topUpMax: number; withdrawalMin: number };
};

export type Movement = {
  id: string;
  type: MovementType;
  /** Con signo: positivo es abono. */
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  /** Solo en WITHDRAWAL y WITHDRAWAL_REVERSAL: el estado actual del retiro. */
  withdrawal: { id: string; status: WithdrawalStatus; rejectionReason: string | null } | null;
};

export type MovementPage = { data: Movement[]; page: number; hasMore: boolean };

export type TopUpResult = {
  credits: number;
  balance: number;
  operationCode: string;
  createdAt: string;
};

export type WithdrawalResult = {
  id: string;
  credits: number;
  phoneLast3: string;
  status: WithdrawalStatus;
  requestedAt: string;
  balance: number;
};
