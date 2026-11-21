import type { HistoryRole } from "@/features/history/types";

/** «Aún no tienes viajes terminados» (19-C), sin botones. */
export function HistoryEmpty({ role }: { role: HistoryRole }) {
  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <svg viewBox="0 0 96 64" className="h-16 w-24" aria-hidden="true" fill="none">
        <path
          d="M10 52 C 30 52, 34 30, 54 30 S 78 16, 84 10"
          stroke="#ffdad7"
          strokeWidth="3"
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
        <path d="M84 10V2l8 4-8 4" fill="#ffdad7" stroke="#bd0016" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="2" y="44" width="26" height="10" rx="4" stroke="#bd0016" strokeWidth="2" fill="white" />
        <path d="M7 44l3-6h10l3 6" stroke="#bd0016" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="9" cy="56" r="3" fill="#bd0016" />
        <circle cx="22" cy="56" r="3" fill="#bd0016" />
      </svg>
      <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
        Aún no tienes viajes terminados
      </h3>
      <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
        {role === "DRIVER"
          ? "Cuando completes un viaje como conductor, aparecerá aquí."
          : "Cuando completes un viaje como pasajero, aparecerá aquí."}
      </p>
    </section>
  );
}
