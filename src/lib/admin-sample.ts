// Datos de EJEMPLO para las secciones del panel que todavía no tienen formulario ni tabla propia
// (reseñas, meseros, comida, quejas y sugerencias). Se reemplazan cuando esas secciones se conecten a Supabase.

export type ActivityKind = "pista" | "resena" | "mesero" | "comida" | "queja" | "sugerencia";
export type ActivityState = "new" | "wip" | "ok";

export const ACTIVITY_KINDS: Record<ActivityKind, { label: string; icon: "pin" | "star" | "user" | "food" | "chat" | "bulb" }> = {
  pista: { label: "Pista", icon: "pin" },
  resena: { label: "Reseña", icon: "star" },
  mesero: { label: "Mesero", icon: "user" },
  comida: { label: "Comida", icon: "food" },
  queja: { label: "Queja", icon: "chat" },
  sugerencia: { label: "Sugerencia", icon: "bulb" },
};

export const ACTIVITY_STATES: Record<ActivityState, { tone: "bad" | "warn" | "ok"; label: string }> = {
  new: { tone: "bad", label: "Nuevo" },
  wip: { tone: "warn", label: "En revisión" },
  ok: { tone: "ok", label: "Resuelto" },
};

export type ActivityRow = {
  id: string;
  kind: ActivityKind;
  text: string;
  sucursal: string;
  state: ActivityState;
  date: string;
  /** Si viene, reemplaza la etiqueta de estado (por ejemplo, "4 ★" en una reseña). */
  badge?: { tone: "bad" | "warn" | "ok"; label: string };
};

