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

// Franjas de una hora, de 11:00 AM a 1:00 AM (14 franjas). Ajustar al horario real del boliche.
export const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const start = 11 + i;
  return `${formatHour(start)} - ${formatHour(start + 1)}`;
});

export type Rating = "angry" | "neutral" | "happy";

export const RATINGS: { value: Rating; label: string }[] = [
  { value: "angry", label: "No se solucionó" },
  { value: "neutral", label: "Más o menos" },
  { value: "happy", label: "Sí, se solucionó" },
];

export type ComplaintForm = {
  lane: number | null;
  day: (typeof DAYS)[number] | null;
  timeSlot: string | null;
  name: string;
  description: string;
  rating: Rating | null;
};

export const EMPTY_FORM: ComplaintForm = {
  lane: null,
  day: null,
  timeSlot: null,
  name: "",
  description: "",
  rating: null,
};
