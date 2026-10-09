"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RATINGS } from "@/lib/form-options";

type Sucursal = { id: string; nombre: string };
type Row = {
  id: string;
  nombre: string;
  pista: number;
  dia_semana: string;
  horario: string;
  descripcion: string;
  calificacion: string;
  created_at: string;
  sucursales: { nombre: string } | null;
};
type Format = "pdf" | "xlsx";

const TZ = "America/Mexico_City";
const OFFSET = "-06:00"; // Ciudad de México ya no usa horario de verano
const ymd = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ });
const dateFmt = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
const longFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short", timeZone: TZ });
const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// jsPDF usa fuentes WinAnsi: los espacios especiales de Intl salen como símbolos raros.
const clean = (s: string) => s.replace(/[  ]/g, " ");
const ratingLabel = (v: string) => RATINGS.find((r) => r.value === v)?.label ?? v;
const isoToLabel = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Fecha y hora "de pared" en Ciudad de México, para escribirlas tal cual en Excel (que no maneja zonas horarias).
function wallParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, Number(x.value)]));
  return { y: p.year, mo: p.month, d: p.day, h: p.hour, mi: p.minute, s: p.second };
}

const inputClass =
  "rounded-xl border-2 border-brand-ink bg-white px-3 py-2 text-[15px] font-medium text-brand-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/20";

async function toDataUrl(url: string) {
  const blob = await (await fetch(url)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportPdf({
  sucursales,
  sucursalInicial,
}: {
  sucursales: Sucursal[];
  sucursalInicial?: string;
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [sucursal, setSucursal] = useState(sucursalInicial ?? "");
  const [busy, setBusy] = useState<Format | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const preset = (days: number | "mes" | "todo") => {
    const now = new Date();
    if (days === "todo") {
      setDesde("");
      setHasta("");
      return;
    }
    const end = ymd.format(now);
    setDesde(days === "mes" ? `${end.slice(0, 8)}01` : ymd.format(new Date(now.getTime() - (days - 1) * 86_400_000)));
    setHasta(end);
  };

  const sucursalNombre = () =>
    sucursal ? (sucursales.find((s) => s.id === sucursal)?.nombre ?? "") : "Todas las sucursales";
  const periodo = () =>
    desde || hasta ? `${desde ? isoToLabel(desde) : "inicio"} al ${hasta ? isoToLabel(hasta) : "hoy"}` : "Todo el historial";
  const fileBase = () => `reporte-quejas-${slug(sucursalNombre())}-${desde || "inicio"}-${hasta || "hoy"}`;

  async function loadRows(): Promise<Row[] | null> {
    if (desde && hasta && desde > hasta) {
      setMsg({ ok: false, text: "La fecha inicial no puede ser posterior a la final." });
      return null;
    }
    const supabase = createClient();
    const rows: Row[] = [];
    for (let from = 0; ; from += 1000) {
      let q = supabase
        .from("reportes")
        .select("id, nombre, pista, dia_semana, horario, descripcion, calificacion, created_at, sucursales(nombre)")
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, from + 999);
      if (sucursal) q = q.eq("sucursal_id", sucursal);
      if (desde) q = q.gte("created_at", `${desde}T00:00:00${OFFSET}`);
      if (hasta) q = q.lte("created_at", `${hasta}T23:59:59.999${OFFSET}`);
      const { data, error } = await q;
      if (error) throw error;
      rows.push(...(data as Row[]));
      if (data.length < 1000) break;
    }
    if (rows.length === 0) {
      setMsg({ ok: false, text: "No hay reportes con esos filtros." });
      return null;
    }
    return rows;
  }

  async function makePdf(rows: Row[]) {
    const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      toDataUrl("/logo-ilusion-bowl.png"),
    ]);

    const RED: [number, number, number] = [212, 32, 43];
    const INK: [number, number, number] = [26, 13, 13];
    const CREAM: [number, number, number] = [255, 244, 227];
    const YELLOW: [number, number, number] = [248, 189, 44];

    // Vertical y tamaño carta, como un documento de Word.
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 14;
    const single = Boolean(sucursal);

    // Encabezado
    doc.addImage(logo, "PNG", M, 10, 18.6, 20);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte de quejas de pistas", M + 24, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Sucursal: ${sucursalNombre()}`, M + 24, 23.5);
    doc.text(`Periodo: ${periodo()}`, M + 24, 28.5);
    doc.setFontSize(8.5);
    doc.setTextColor(90, 67, 67);
    doc.text(`Generado el ${clean(longFmt.format(new Date()))}`, M + 24, 33.5);
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.8);
    doc.line(M, 37, W - M, 37);

    // Resumen
    const total = rows.length;
    const count = (v: string) => rows.filter((r) => r.calificacion === v).length;
    const stats: [string, number, [number, number, number]][] = [
      ["Total de reportes", total, YELLOW],
      ["Se solucionó", count("happy"), [134, 217, 87]],
      ["Más o menos", count("neutral"), [251, 191, 36]],
      ["No se solucionó", count("angry"), [248, 113, 113]],
    ];
    const gap = 4;
    const boxW = (W - 2 * M - 3 * gap) / 4;
    stats.forEach(([label, n, color], i) => {
      const x = M + i * (boxW + gap);
      doc.setFillColor(...color);
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, 42, boxW, 19, 3, 3, "FD");
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.text(String(n), x + 4, 52.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(label, x + 4, 57.5);
      if (i > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`${Math.round((n / total) * 100)}%`, x + boxW - 4, 52.5, { align: "right" });
      }
    });

    // Resumen por sucursal (solo si el reporte incluye varias)
    let startY = 68;
    const porSucursal = new Map<string, { total: number; happy: number }>();
    rows.forEach((r) => {
      const k = r.sucursales?.nombre ?? "—";
      const cur = porSucursal.get(k) ?? { total: 0, happy: 0 };
      cur.total++;
      if (r.calificacion === "happy") cur.happy++;
      porSucursal.set(k, cur);
    });
    if (porSucursal.size > 1) {
      autoTable(doc, {
        startY,
        margin: { left: M, right: W / 2 - 4 },
        head: [["Sucursal", "Reportes", "Solucionados"]],
        body: [...porSucursal.entries()]
          .sort((a, b) => b[1].total - a[1].total)
          .map(([nombre, v]) => [nombre, String(v.total), `${Math.round((v.happy / v.total) * 100)}%`]),
        styles: { fontSize: 8.5, cellPadding: 1.8, textColor: INK },
        headStyles: { fillColor: INK, textColor: CREAM },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
      });
      startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    // Detalle: vertical, así que se junta fecha y hora y se omite la sucursal si el reporte es de una sola.
    const head = ["Fecha y hora", ...(single ? [] : ["Sucursal"]), "Pista", "Ocurrió", "Quién reportó", "Problema", "¿Se solucionó?"];
    const body = rows.map((r) => {
      const d = new Date(r.created_at);
      return [
        `${dateFmt.format(d)}\n${clean(timeFmt.format(d))}`,
        ...(single ? [] : [r.sucursales?.nombre ?? "—"]),
        String(r.pista),
        `${r.dia_semana}\n${r.horario}`,
        r.nombre,
        r.descripcion,
        ratingLabel(r.calificacion),
      ];
    });
    const styles: Record<number, { cellWidth?: number; halign?: "center" }> = single
      ? { 0: { cellWidth: 22 }, 1: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 29 }, 3: { cellWidth: 26 }, 5: { cellWidth: 21 } }
      : { 0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 10, halign: "center" }, 3: { cellWidth: 29 }, 4: { cellWidth: 24 }, 6: { cellWidth: 20 } };

    autoTable(doc, {
      startY,
      margin: { left: M, right: M, bottom: 16 },
      head: [head],
      body,
      styles: { fontSize: 8, cellPadding: 1.8, textColor: INK, valign: "top", overflow: "linebreak" },
      headStyles: { fillColor: RED, textColor: CREAM, fontStyle: "bold" },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles: styles,
      rowPageBreak: "avoid",
    });

    // Pie de página
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(90, 67, 67);
      doc.text("Ilusion Bowl · Reporte de quejas de pistas", M, H - 8);
      doc.text(`Página ${i} de ${pages}`, W - M, H - 8, { align: "right" });
    }

    doc.save(`${fileBase()}.pdf`);
  }

  async function makeXlsx(rows: Row[]) {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "Ilusion Bowl";
    wb.created = new Date();

    const ws = wb.addWorksheet("Reportes", { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = [
      { header: "Fecha del reporte", key: "fecha", width: 17, style: { numFmt: "dd/mm/yyyy" } },
      { header: "Hora del reporte", key: "hora", width: 16, style: { numFmt: "h:mm AM/PM" } },
      { header: "Sucursal", key: "sucursal", width: 22 },
      { header: "Pista", key: "pista", width: 8 },
      { header: "Día en que ocurrió", key: "dia", width: 18 },
      { header: "Horario en que ocurrió", key: "horario", width: 25 },
      { header: "Quién reportó", key: "nombre", width: 24 },
      { header: "Problema", key: "descripcion", width: 60 },
      { header: "¿Se solucionó?", key: "calificacion", width: 18 },
    ];
    rows.forEach((r) => {
      const p = wallParts(new Date(r.created_at));
      ws.addRow({
        fecha: new Date(Date.UTC(p.y, p.mo - 1, p.d)),
        hora: (p.h * 3600 + p.mi * 60 + p.s) / 86400,
        sucursal: r.sucursales?.nombre ?? "—",
        pista: r.pista,
        dia: r.dia_semana,
        horario: r.horario,
        nombre: r.nombre,
        descripcion: r.descripcion,
        calificacion: ratingLabel(r.calificacion),
      });
    });
    ws.getColumn("descripcion").alignment = { wrapText: true, vertical: "top" };
    ws.getColumn("pista").alignment = { horizontal: "center", vertical: "top" };
    const header = ws.getRow(1);
    header.height = 22;
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4202B" } };
      cell.font = { bold: true, color: { argb: "FFFFF4E3" } };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };

    // Hoja de resumen
    const rs = wb.addWorksheet("Resumen");
    rs.columns = [{ width: 28 }, { width: 22 }, { width: 16 }];
    const total = rows.length;
    const count = (v: string) => rows.filter((r) => r.calificacion === v).length;
    rs.addRow(["Reporte de quejas de pistas · Ilusion Bowl"]).font = { bold: true, size: 14 };
    rs.addRow([]);
    rs.addRow(["Sucursal", sucursalNombre()]);
    rs.addRow(["Periodo", periodo()]);
    rs.addRow(["Generado", clean(longFmt.format(new Date()))]);
    rs.addRow([]);
    rs.addRow(["Total de reportes", total]);
    rs.addRow(["Se solucionó", count("happy")]);
    rs.addRow(["Más o menos", count("neutral")]);
    rs.addRow(["No se solucionó", count("angry")]);
    for (let i = 3; i <= 10; i++) rs.getRow(i).getCell(1).font = { bold: true };
    rs.addRow([]);

    const porSucursal = new Map<string, { total: number; happy: number }>();
    rows.forEach((r) => {
      const k = r.sucursales?.nombre ?? "—";
      const cur = porSucursal.get(k) ?? { total: 0, happy: 0 };
      cur.total++;
      if (r.calificacion === "happy") cur.happy++;
      porSucursal.set(k, cur);
    });
    const h = rs.addRow(["Sucursal", "Reportes", "% solucionados"]);
    h.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A0D0D" } };
      cell.font = { bold: true, color: { argb: "FFFFF4E3" } };
    });
    [...porSucursal.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([nombre, v]) => {
        const row = rs.addRow([nombre, v.total, v.happy / v.total]);
        row.getCell(3).numFmt = "0%";
      });

    const buffer = await wb.xlsx.writeBuffer();
    saveBlob(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${fileBase()}.xlsx`,
    );
  }

  async function download(format: Format) {
    setBusy(format);
    setMsg(null);
    try {
      const rows = await loadRows();
      if (!rows) return;
      if (format === "pdf") await makePdf(rows);
      else await makeXlsx(rows);
      setMsg({
        ok: true,
        text: `${format === "pdf" ? "PDF" : "Excel"} generado con ${rows.length} ${rows.length === 1 ? "reporte" : "reportes"}.`,
      });
    } catch (e) {
      console.error(e);
      setMsg({ ok: false, text: "No se pudo generar el archivo. Inténtalo de nuevo." });
    } finally {
      setBusy(null);
    }
  }

  const chip =
    "rounded-full border-2 border-brand-ink bg-white px-3 py-1 text-xs font-bold text-brand-ink hover:bg-brand-yellow";

  return (
    <div className="mt-5 rounded-2xl border-2 border-brand-ink bg-white p-4">
      <h2 className="text-lg font-black text-brand-ink">Descargar reporte</h2>
      <p className="text-sm text-neutral-700">
        Elige el periodo y la sucursal. Si dejas las fechas vacías se incluye todo. El PDF es para imprimir y el Excel
        para trabajar los datos.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold text-brand-ink">
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={`${inputClass} mt-1 block`} />
        </label>
        <label className="text-sm font-bold text-brand-ink">
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={`${inputClass} mt-1 block`} />
        </label>
        <label className="text-sm font-bold text-brand-ink">
          Sucursal
          <select value={sucursal} onChange={(e) => setSucursal(e.target.value)} className={`${inputClass} mt-1 block`}>
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => download("pdf")}
          disabled={busy !== null}
          className="rounded-xl border-2 border-brand-ink bg-brand-red px-5 py-2.5 font-bold text-brand-cream shadow-[3px_3px_0_0_#1a0d0d] hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600 disabled:shadow-none"
        >
          {busy === "pdf" ? "Generando..." : "Descargar PDF"}
        </button>
        <button
          type="button"
          onClick={() => download("xlsx")}
          disabled={busy !== null}
          className="rounded-xl border-2 border-brand-ink bg-brand-yellow px-5 py-2.5 font-bold text-brand-ink shadow-[3px_3px_0_0_#1a0d0d] hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600 disabled:shadow-none"
        >
          {busy === "xlsx" ? "Generando..." : "Descargar Excel"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-neutral-700">Atajos:</span>
        <button type="button" className={chip} onClick={() => preset(1)}>Hoy</button>
        <button type="button" className={chip} onClick={() => preset(7)}>Últimos 7 días</button>
        <button type="button" className={chip} onClick={() => preset(30)}>Últimos 30 días</button>
        <button type="button" className={chip} onClick={() => preset("mes")}>Este mes</button>
        <button type="button" className={chip} onClick={() => preset("todo")}>Todo</button>
      </div>

      {msg && (
        <p role="status" className={`mt-3 text-sm font-semibold ${msg.ok ? "text-green-800" : "text-brand-red-dark"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
