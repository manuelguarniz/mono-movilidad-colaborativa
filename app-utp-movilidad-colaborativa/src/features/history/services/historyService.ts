import { apiClient } from "@/shared/api/apiClient";
import type { HistoryPage, HistoryRole } from "@/features/history/types";

export const historyService = {
  /** 20 viajes terminados por página, del más reciente al más antiguo (RF-09). */
  getHistory: (role: HistoryRole, page: number) =>
    apiClient.get<unknown, HistoryPage>("/history", { params: { role, page } }),
};
