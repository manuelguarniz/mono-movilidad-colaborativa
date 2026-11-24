import { apiClient } from "@/shared/api/apiClient";
import type {
  Movement,
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

  /** Todo el historial (para exportarlo): recorre todas las páginas, del más reciente al más antiguo. */
  getAllMovements: async () => {
    const result: Movement[] = [];
    for (let page = 1; ; page++) {
      const { data, hasMore } = await walletService.getMovements(page);
      result.push(...data);
      if (!hasMore) {
        return result;
      }
    }
  },

  /** Recarga simulada con Yape (RN-41): `amount` en soles, 1 crédito por sol. */
  topUp: (amount: number, operationCode: string) =>
    apiClient.post<unknown, TopUpResult>("/wallet/top-ups", { amount, operationCode }),

  /** Retiro a Yape (RN-42): descuenta los créditos al solicitarlo. */
  withdraw: (amount: number, yapePhone: string) =>
    apiClient.post<unknown, WithdrawalResult>("/wallet/withdrawals", { amount, yapePhone }),
};
