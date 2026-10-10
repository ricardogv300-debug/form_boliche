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

export const FOODS = [
  { name: "Alitas BBQ", group: "Alimentos", rating: 4.1, reviews: 63 },
  { name: "Nachos de la casa", group: "Alimentos", rating: 4.6, reviews: 58 },
  { name: "Hamburguesa Strike", group: "Alimentos", rating: 4.8, reviews: 52 },
  { name: "Cerveza artesanal", group: "Bebidas", rating: 4.5, reviews: 47 },
  { name: "Limonada mineral", group: "Bebidas", rating: 4.2, reviews: 31 },
];

export const FOOD_COMMENTS = [
  { name: "Hamburguesa Strike", stars: 5, text: "La carne en su punto y el pan recién hecho.", sucursal: "Zona Real" },
  { name: "Alitas BBQ", stars: 2, text: "Llegaron frías y sin suficiente salsa.", sucursal: "Zona Real" },
  { name: "Cerveza artesanal", stars: 4, text: "Muy buena selección, faltó una opción sin alcohol.", sucursal: "Galerías Santa Anita" },
];
