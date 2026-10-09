export const LANES = Array.from({ length: 24 }, (_, i) => i + 1);

export const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

function formatHour(h: number) {
  const suffix = h >= 12 && h < 24 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
}

// Franjas de una hora, de 12:00 PM a 12:00 AM. Ajustar al horario real del boliche.
export const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const start = 12 + i;
  return `${formatHour(start)} - ${formatHour(start + 1)}`;
});

export type Rating = "angry" | "neutral" | "happy";

export const RATINGS: { value: Rating; label: string }[] = [
  { value: "angry", label: "No se solucionó" },
  { value: "neutral", label: "Más o menos" },
  { value: "happy", label: "Sí, se solucionó" },
];

export type ComplaintForm = {
  sede: string;
  lane: number | null;
  day: (typeof DAYS)[number] | null;
  timeSlot: string | null;
  description: string;
  rating: Rating | null;
};

export const EMPTY_FORM: ComplaintForm = {
  sede: "",
  lane: null,
  day: null,
  timeSlot: null,
  description: "",
  rating: null,
};
