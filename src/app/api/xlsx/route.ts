import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { RATINGS } from "@/lib/form-options";

type Row = {
  nombre: string;
  pista: number;
  dia_semana: string;
  horario: string;
  descripcion: string;
  calificacion: string;
  created_at: string;
  sucursales: { nombre: string } | null;
};
type Body = { rows: Row[]; sucursal: string; periodo: string; generado: string };

const TZ = "America/Mexico_City";
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
const ratingLabel = (v: string) => RATINGS.find((r) => r.value === v)?.label ?? v;

// Fecha y hora "de pared" en Ciudad de México, para escribirlas tal cual en Excel (que no maneja zonas horarias).
function wallParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, Number(x.value)]));
  return { y: p.year, mo: p.month, d: p.day, h: p.hour, mi: p.minute, s: p.second };
}

// El Excel se arma aquí (Node) y no en el navegador: empaquetado para el cliente, exceljs generaba archivos dañados.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return new Response("No autorizado", { status: 401 });

  const { rows, sucursal, periodo, generado } = (await request.json()) as Body;

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
  rs.addRow(["Sucursal", sucursal]);
  rs.addRow(["Periodo", periodo]);
  rs.addRow(["Generado", generado]);
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
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-store",
    },
  });
}
