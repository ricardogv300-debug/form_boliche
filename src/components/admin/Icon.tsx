// Iconos de línea del panel. Cada uno es un trazo SVG de 24x24; el color lo toma de `currentColor`.
const PATHS = {
  grid: "M4.5 3h5a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 9.5 11h-5A1.5 1.5 0 0 1 3 9.5v-5A1.5 1.5 0 0 1 4.5 3ZM14.5 3h5A1.5 1.5 0 0 1 21 4.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 13 9.5v-5A1.5 1.5 0 0 1 14.5 3ZM4.5 13h5a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 9.5 21h-5A1.5 1.5 0 0 1 3 19.5v-5A1.5 1.5 0 0 1 4.5 13ZM14.5 13h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5a1.5 1.5 0 0 1 1.5-1.5Z",
  pin: "M10 2h4l.8 5-1.1 2.6c2.3 1.4 3.8 3.800 3.800 6.400a5.500 5.500 0 0 1-11 0c0-2.600 1.500-5 3.800-6.400L9.200 7zM9 7h6",
  star: "m12 2 3.100 6.300 6.900 1-5 4.900 1.200 6.900-6.200-3.300-6.200 3.300L7 14.200 2 9.300l6.900-1z",
  user: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  food: "M3 2v7c0 1.100.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.100.9 2 2 2h3Zm0 0v7",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  bulb: "M15 14c.2-1 .7-1.700 1.500-2.500 1-.9 1.500-2.200 1.500-3.500A6 6 0 0 0 6 8c0 1 .2 2.300 1.500 3.500.7.7 1.300 1.500 1.500 2.500M9 18h6M10 22h4",
  store: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 13v.01M9 17v.01",
  qr: "M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1ZM14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4",
  chart: "M3 3v18h18M8 17v-5M13 17V8M18 17v-9",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400",
  moon: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  search: "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM21 21l-4.300-4.300",
  up: "M7 17 17 7M8 7h9v9",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM22 21v-2a4 4 0 0 0-3-3.870M16 3.130a4 4 0 0 1 0 7.750",
  menu: "M4 6h16M4 12h16M4 18h16",
  left: "m15 18-6-6 6-6M20 4v16",
  down: "M7 7l10 10M17 8v9H8",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name }: { name: IconName }) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={i <= Math.round(value) ? "" : "off"}>
          <path d={PATHS.star} />
        </svg>
      ))}
    </span>
  );
}
