import type { Movement, Wallet, WithdrawalStatus } from "@/features/wallet/types";
import { MOVEMENT_TITLE, limaDay } from "@/features/wallet/utils";
import { formatLimaTime } from "@/shared/utils/limaTime";

const LIMA = "America/Lima";
const BRAND_RED: [number, number, number] = [189, 0, 22];
const CREDIT_GREEN: [number, number, number] = [27, 127, 59];
const MUTED: [number, number, number] = [95, 94, 94];

const fullDate = new Intl.DateTimeFormat("es-PE", {
  timeZone: LIMA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  PENDING: "En proceso",
  PAID: "Pagado",
  REJECTED: "Rechazado",
};

// La fuente estándar del PDF no tiene el signo menos tipográfico (U+2212): se usa el guion.
const signed = (amount: number) => (amount > 0 ? `+${amount}` : `-${Math.abs(amount)}`);

/**
 * La fuente estándar del PDF solo cubre Latin-1: un carácter fuera de ella (como «→») sale
 * ilegible y separa todas las letras de la celda. Se reemplazan los conocidos y se quitan el resto.
 */
const pdfText = (text: string) =>
  text
    .replace(/\s*[→➔⟶]\s*/g, " > ")
    .replace(/[−–—]/g, "-")
    .replace(/[•]/g, "·")
    .replace(/[^\u0000-ÿ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function detail(movement: Movement) {
  const withdrawal = movement.type === "WITHDRAWAL" ? movement.withdrawal : null;
  if (!withdrawal) {
    return pdfText(movement.description);
  }
  const reason =
    withdrawal.status === "REJECTED" && withdrawal.rejectionReason
      ? ` (${withdrawal.rejectionReason})`
      : "";
  return pdfText(`${movement.description} · ${STATUS_LABEL[withdrawal.status]}${reason}`);
}

/**
 * Genera y descarga el PDF con el historial de movimientos del periodo `from`–`to`.
 * jsPDF se carga bajo demanda para no sumar su peso al arranque de la app.
 */
export async function exportMovementsPdf(params: {
  movements: Movement[];
  wallet: Wallet | undefined;
  from: Date;
  to: Date;
}) {
  const { movements, wallet, from, to } = params;
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_RED);
  doc.text("ColaboraCar", margin, 50);

  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Historial de movimientos", margin, 74);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`Periodo: ${fullDate.format(from)} al ${fullDate.format(to)}`, margin, 94);
  doc.text(
    `Generado: ${fullDate.format(to)} ${formatLimaTime(to)} (hora de Perú)`,
    margin,
    108,
  );

  const credits = movements.filter((item) => item.amount > 0).reduce((s, i) => s + i.amount, 0);
  const debits = movements.filter((item) => item.amount < 0).reduce((s, i) => s - i.amount, 0);
  const summary = [
    `Movimientos: ${movements.length}`,
    `Abonos: +${credits}`,
    `Cargos: -${debits}`,
    ...(wallet ? [`Saldo disponible: ${wallet.available}`, `Retenido: ${wallet.held}`] : []),
  ];
  doc.text(summary.join("   ·   "), margin, 126, { maxWidth: pageWidth - margin * 2 });

  autoTable(doc, {
    startY: 144,
    margin: { left: margin, right: margin },
    head: [["Fecha", "Hora", "Movimiento", "Detalle", "Créditos", "Saldo"]],
    body: movements.map((item) => {
      const date = new Date(item.createdAt);
      return [
        limaDay(date).split("-").reverse().join("/"),
        formatLimaTime(date),
        MOVEMENT_TITLE[item.type],
        detail(item),
        signed(item.amount),
        String(item.balanceAfter),
      ];
    }),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5, valign: "middle" },
    headStyles: { fillColor: BRAND_RED, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 245, 245] },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 38 },
      2: { cellWidth: 92 },
      4: { cellWidth: 52, halign: "right", fontStyle: "bold" },
      5: { cellWidth: 44, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const amount = movements[data.row.index]?.amount ?? 0;
        if (amount > 0) {
          data.cell.styles.textColor = CREDIT_GREEN;
        }
      }
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(
        `Página ${doc.getCurrentPageInfo().pageNumber} · 1 crédito = S/ 1`,
        pageWidth - margin,
        pageHeight - 20,
        { align: "right" },
      );
    },
  });

  if (movements.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No tuviste movimientos en este periodo.", margin, 190);
  }

  doc.save(`movimientos-${limaDay(from)}_${limaDay(to)}.pdf`);
}
