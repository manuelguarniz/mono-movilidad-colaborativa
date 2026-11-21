import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboardService";
import { HistoryCard } from "@/features/history/components/HistoryCard";
import { HistoryEmpty } from "@/features/history/components/HistoryEmpty";
import { historyService } from "@/features/history/services/historyService";
import type { HistoryEntry, HistoryRole } from "@/features/history/types";
import { monthGroup } from "@/features/history/utils";
import { errorMessage } from "@/features/my-rides/utils";
import ChevronDownIcon from "@/assets/images/icons/chevron-down.svg?react";

const TABS: { role: HistoryRole; label: string }[] = [
  { role: "PASSENGER", label: "Como pasajero" },
  { role: "DRIVER", label: "Como conductor" },
];

function groupByMonth(entries: HistoryEntry[]) {
  const groups: { key: string; label: string; items: HistoryEntry[] }[] = [];
  for (const entry of entries) {
    const { key, label } = monthGroup(new Date(entry.departureTime));
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.items.push(entry);
    } else {
      groups.push({ key, label, items: [entry] });
    }
  }
  return groups;
}

/**
 * Historial (P19). Las pestañas filtran por rol y no cambian el modo de la app (RN-48); se
 * abre en la del modo actual del perfil. 20 viajes por página con «Ver más viajes» (RF-09).
 */
export function HistoryPage() {
  const userQuery = useQuery({ queryKey: ["users", "me"], queryFn: dashboardService.getCurrentUser });
  const [selected, setSelected] = useState<HistoryRole | null>(null);
  const role: HistoryRole | null =
    selected ?? (userQuery.data ? (userQuery.data.activeMode === "DRIVER" ? "DRIVER" : "PASSENGER") : null);

  const historyQuery = useInfiniteQuery({
    queryKey: ["history", role],
    queryFn: ({ pageParam }) => historyService.getHistory(role!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: role !== null,
  });
  const entries = historyQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="dashboard-page pb-4">
      <div>
        <p className="publish-label">Viajes terminados</p>
        <h2 className="mt-1 text-[1.75rem] font-semibold leading-tight text-[var(--text-primary)]">
          Historial
        </h2>
      </div>

      <div className="history-tabs" role="tablist" aria-label="Historial por rol">
        {TABS.map((tab) => (
          <button
            key={tab.role}
            type="button"
            role="tab"
            id={`history-tab-${tab.role}`}
            aria-selected={role === tab.role}
            aria-controls="history-panel"
            className="history-tab"
            onClick={() => setSelected(tab.role)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section id="history-panel" role="tabpanel" aria-labelledby={role ? `history-tab-${role}` : undefined}>
        {role === null || historyQuery.isLoading ? (
          userQuery.isError ? (
            <div className="dashboard-alert" role="alert">
              <p className="flex-1">{errorMessage(userQuery.error)}</p>
              <button type="button" className="shrink-0 font-semibold underline" onClick={() => userQuery.refetch()}>
                Reintentar
              </button>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando tu historial...</p>
          )
        ) : historyQuery.isError && !entries.length ? (
          <div className="dashboard-alert" role="alert">
            <p className="flex-1">{errorMessage(historyQuery.error)}</p>
            <button type="button" className="shrink-0 font-semibold underline" onClick={() => historyQuery.refetch()}>
              Reintentar
            </button>
          </div>
        ) : entries.length === 0 ? (
          <HistoryEmpty role={role} />
        ) : (
          groupByMonth(entries).map((group) => (
            <section key={group.key} aria-label={group.label}>
              <h3 className="wallet-day-label mt-2">{group.label}</h3>
              <div className="space-y-3">
                {group.items.map((entry) => (
                  <HistoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))
        )}

        {historyQuery.hasNextPage ? (
          <button
            type="button"
            className="my-rides-text-button mx-auto mt-4 flex items-center gap-1"
            disabled={historyQuery.isFetchingNextPage}
            onClick={() => historyQuery.fetchNextPage()}
          >
            {historyQuery.isFetchingNextPage ? "Cargando..." : "Ver más viajes"}
            {historyQuery.isFetchingNextPage ? null : <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />}
          </button>
        ) : null}
      </section>
    </div>
  );
}
