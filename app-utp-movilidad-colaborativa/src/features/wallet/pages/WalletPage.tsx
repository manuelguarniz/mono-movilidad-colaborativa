import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { BalanceCard } from "@/features/wallet/components/BalanceCard";
import { MovementList } from "@/features/wallet/components/MovementList";
import { TopUpSheet } from "@/features/wallet/components/TopUpSheet";
import { WithdrawSheet } from "@/features/wallet/components/WithdrawSheet";
import { walletService } from "@/features/wallet/services/walletService";
import { exportMovementsPdf } from "@/features/wallet/exportMovementsPdf";
import DownloadIcon from "@/assets/images/icons/download.svg?react";
import { formatDepartureLabel } from "@/shared/utils/limaTime";
import ClockIcon from "@/assets/images/icons/clock.svg?react";
import CarIcon from "@/assets/images/icons/ride.svg?react";
import UserIcon from "@/assets/images/icons/user.svg?react";

const TOAST_MS = 3000;

type Sheet = "top-up" | "withdraw" | null;

// Solo rutas internas de la app: evita redirigir a otro sitio con `?volver=`.
const safeReturn = (path: string | null) =>
  path && path.startsWith("/") && !path.startsWith("//") ? path : null;

/**
 * Billetera (P21). Saldo, movimientos, recarga simulada (21-C, 21-D) y, en modo conductor,
 * retiro a Yape (21-E, 21-F). `?recargar=1` abre la recarga, y `volver` es la pantalla a la
 * que regresa «Listo» (la reserva sin saldo de RN-39).
 */
export function WalletPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheet, setSheet] = useState<Sheet>(() =>
    searchParams.get("recargar") ? "top-up" : null,
  );
  const [returnTo] = useState(() => safeReturn(searchParams.get("volver")));
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Los parámetros solo sirven al entrar: se quitan para que recargar la página no reabra la hoja.
  useEffect(() => {
    if (searchParams.has("recargar") || searchParams.has("volver")) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const walletQuery = useQuery({ queryKey: ["wallet"], queryFn: walletService.getWallet });
  const movementsQuery = useInfiniteQuery({
    queryKey: ["wallet", "movements"],
    queryFn: ({ pageParam }) => walletService.getMovements(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const wallet = walletQuery.data;
  const isDriver = wallet?.activeMode === "DRIVER";
  const movements = movementsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const pending = wallet?.pendingWithdrawal;

  // Exporta a PDF todo el historial, aunque no esté cargado en la lista.
  const handleExport = async () => {
    setExporting(true);
    try {
      const to = new Date();
      const all = await walletService.getAllMovements();
      // Vienen del más reciente al más antiguo: el periodo empieza en el último.
      const oldest = all[all.length - 1];
      const from = oldest ? new Date(oldest.createdAt) : to;
      await exportMovementsPdf({ movements: all, wallet, from, to });
      setToast(all.length ? "PDF descargado" : "PDF descargado (aún no tienes movimientos)");
    } catch {
      setToast("No pudimos exportar tus movimientos");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="flex items-end justify-between gap-3 pb-1">
        <div>
          <p className="publish-label">Créditos</p>
          <h2 className="mt-1 text-[1.75rem] font-semibold leading-tight text-[var(--text-primary)]">
            Billetera
          </h2>
        </div>
        {wallet ? (
          <span className="mode-chip">
            {isDriver ? <CarIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            {isDriver ? "Modo conductor" : "Modo pasajero"}
          </span>
        ) : null}
      </div>

      {walletQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Cargando...</p>
      ) : walletQuery.isError || !wallet ? (
        <div className="dashboard-alert" role="alert">
          <p className="flex-1">No pudimos cargar tu billetera.</p>
          <button
            type="button"
            className="shrink-0 font-semibold underline"
            onClick={() => walletQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <BalanceCard
            wallet={wallet}
            onTopUp={() => setSheet("top-up")}
            onWithdraw={() => setSheet("withdraw")}
          />

          {isDriver && pending ? (
            <div className="wallet-amber" role="status">
              <ClockIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold tabular-nums">
                  Retiro en proceso · {pending.credits} créditos a{" "}
                  <span className="whitespace-nowrap">Yape •••• {pending.phoneLast3}</span>
                </p>
                <p className="mt-0.5 tabular-nums">
                  Solicitado {formatDepartureLabel(new Date(pending.requestedAt)).toLowerCase()}. Te
                  avisaremos cuando se pague.
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}

      <section aria-labelledby="wallet-movements-title" className="pb-4">
        <div className="mt-2 flex items-center justify-between gap-3">
          <h2 id="wallet-movements-title" className="publish-label">
            Movimientos
          </h2>
          <button
            type="button"
            className="my-rides-text-button inline-flex items-center gap-1.5 disabled:opacity-60"
            disabled={exporting || movementsQuery.isLoading}
            onClick={handleExport}
            aria-label="Exportar en PDF todo el historial de movimientos"
          >
            <DownloadIcon className="h-4 w-4" aria-hidden="true" />
            {exporting ? "Exportando..." : "Exportar"}
          </button>
        </div>
        {movementsQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">Cargando movimientos...</p>
        ) : movementsQuery.isError && !movements.length ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">
            No pudimos cargar tus movimientos.
          </p>
        ) : movements.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">
            Aún no tienes movimientos.
          </p>
        ) : (
          <MovementList movements={movements} />
        )}
        {movementsQuery.hasNextPage ? (
          <button
            type="button"
            className="my-rides-text-button mx-auto mt-4 block"
            disabled={movementsQuery.isFetchingNextPage}
            onClick={() => movementsQuery.fetchNextPage()}
          >
            {movementsQuery.isFetchingNextPage ? "Cargando..." : "Ver más movimientos"}
          </button>
        ) : null}
      </section>

      {toast ? (
        <p className="app-toast" role="status">
          {toast}
        </p>
      ) : null}

      {sheet === "top-up" && wallet ? (
        <TopUpSheet
          limits={wallet.limits}
          onClose={() => setSheet(null)}
          onDone={() => {
            setSheet(null);
            if (returnTo) {
              navigate(returnTo);
            }
          }}
        />
      ) : null}

      {sheet === "withdraw" && wallet ? (
        <WithdrawSheet
          wallet={wallet}
          onClose={() => setSheet(null)}
          onRequested={() => {
            setSheet(null);
            setToast("Retiro solicitado");
          }}
        />
      ) : null}
    </div>
  );
}
