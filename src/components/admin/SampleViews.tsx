"use client";

import { useState } from "react";
import {
  ACTIVITY_KINDS,
  ACTIVITY_STATES,
  FOODS,
  FOOD_COMMENTS,
  type ActivityKind,
  type ActivityRow,
} from "@/lib/admin-sample";
import Icon, { Stars } from "./Icon";

function Chips<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ActivityTable({ data }: { data: ActivityRow[] }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"" | ActivityKind>("");
  const needle = q.trim().toLowerCase();
  const rows = data.filter(
    (r) =>
      (!kind || r.kind === kind) &&
      (!needle || `${r.id} ${r.text} ${r.sucursal} ${ACTIVITY_KINDS[r.kind].label}`.toLowerCase().includes(needle)),
  ).slice(0, 5);

  return (
    <>
      <div className="row between wrap">
        <h2>Actividad reciente</h2>
        <div className="tools2">
          <label className="search">
            <Icon name="search" />
            <input type="search" placeholder="Buscar" aria-label="Buscar actividad" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select className="sel" aria-label="Filtrar por tipo" value={kind} onChange={(e) => setKind(e.target.value as "" | ActivityKind)}>
            <option value="">Todos los tipos</option>
            {Object.entries(ACTIVITY_KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Tipo</th>
              <th>Detalle</th>
              <th>Sucursal</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const k = ACTIVITY_KINDS[r.kind];
              const s = r.badge ?? ACTIVITY_STATES[r.state];
              return (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>
                    <span className="kind">
                      <span className="ico">
                        <Icon name={k.icon} />
                      </span>
                      {k.label}
                    </span>
                  </td>
                  <td>{r.text}</td>
                  <td>{r.sucursal}</td>
                  <td>
                    <span className={`tag ${s.tone}`}>
                      <span>{s.label}</span>
                    </span>
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {r.date}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  {data.length === 0 ? "Todavía no hay actividad." : "Nada coincide con tu búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FoodPanel() {
  const [group, setGroup] = useState<string>("Todo");
  const rows = FOODS.filter((f) => group === "Todo" || f.group === group).sort((a, b) => b.rating - a.rating);
  return (
    <div className="grid g-2">
      <div className="card">
        <div className="row between wrap">
          <h2>Ranking</h2>
          <Chips options={["Todo", "Alimentos", "Bebidas"].map((s) => ({ value: s, label: s }))} value={group} onChange={setGroup} />
        </div>
        <div className="list" style={{ gap: 14 }}>
          {rows.map((f) => (
            <div key={f.name}>
              <div className="row between">
                <b>{f.name}</b>
                <span className="mono">
                  <b>{f.rating}</b> <span className="lbl">· {f.reviews} reseñas</span>
                </span>
              </div>
              <div className="bar" style={{ marginTop: 8 }}>
                <i style={{ width: `${(f.rating / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>Comentarios recientes</h2>
        <div className="list">
          {FOOD_COMMENTS.map((r) => (
            <div className="item" key={r.name + r.text}>
              <div className="row between wrap">
                <div className="who">
                  <div className="avatar">
                    <Icon name="food" />
                  </div>
                  <div>
                    <b>{r.name}</b>
                    <span className="meta">{r.sucursal}</span>
                  </div>
                </div>
                <Stars value={r.stars} />
              </div>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
