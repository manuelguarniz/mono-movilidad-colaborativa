import { apiClient } from "@/shared/api/apiClient";
import type {
  MovementPage,
  TopUpResult,
  Wallet,
  WithdrawalResult,
} from "@/features/wallet/types";

export const walletService = {
  getWallet: () => apiClient.get<unknown, Wallet>("/wallet"),

  /** 20 movimientos por página, del más reciente al más antiguo (RF-11). */
  getMovements: (page: number) =>
    apiClient.get<unknown, MovementPage>("/wallet/movements", { params: { page } }),

  /** Recarga simulada con Yape (RN-41): `amount` en soles, 1 crédito por sol. */
  topUp: (amount: number, operationCode: string) =>
    apiClient.post<unknown, TopUpResult>("/wallet/top-ups", { amount, operationCode }),

  /** Retiro a Yape (RN-42): descuenta los créditos al solicitarlo. */
  withdraw: (amount: number, yapePhone: string) =>
    apiClient.post<unknown, WithdrawalResult>("/wallet/withdrawals", { amount, yapePhone }),
};
