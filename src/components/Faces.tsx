import type { Rating } from "@/lib/form-options";

const COLORS: Record<Rating, string> = {
  angry: "#f87171",
  neutral: "#fbbf24",
  happy: "#86d957",
};

export function Face({ type, size = 56 }: { type: Rating; size?: number }) {
  const color = COLORS[type];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="22" fill={color} />
      {type === "angry" && (
        <>
          <path d="M12 15l9 4M36 15l-9 4" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="17" cy="23" r="2.2" fill="#1a1a1a" />
          <circle cx="31" cy="23" r="2.2" fill="#1a1a1a" />
          <path d="M16 35c2-4 14-4 16 0" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {type === "neutral" && (
        <>
          <circle cx="17" cy="20" r="2.2" fill="#1a1a1a" />
          <circle cx="31" cy="20" r="2.2" fill="#1a1a1a" />
          <path d="M16 33h16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {type === "happy" && (
        <>
          <circle cx="17" cy="20" r="2.2" fill="#1a1a1a" />
          <circle cx="31" cy="20" r="2.2" fill="#1a1a1a" />
          <path d="M15 29c3 7 15 7 18 0" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
