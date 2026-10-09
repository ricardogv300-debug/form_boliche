export const SEDES = [
  { slug: "ciudadela", name: "Ciudadela" },
  { slug: "galerias-santa-anita", name: "Galerías Santa Anita" },
  { slug: "zona-real", name: "Zona Real" },
  { slug: "san-pedro", name: "San Pedro" },
] as const;

export type Sede = (typeof SEDES)[number];

export function getSede(slug: string): Sede | undefined {
  return SEDES.find((s) => s.slug === slug);
}
