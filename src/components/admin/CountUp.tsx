"use client";

import { useEffect, useRef } from "react";

// Cuenta desde 0 hasta `value` al aparecer. El HTML ya trae el número final, así que sin JS o con
// movimiento reducido se ve igual, solo que sin animación.
export default function CountUp({ value, decimals = 0, duration = 900 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (value * eased).toFixed(decimals);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, decimals, duration]);

  return (
    <span ref={ref} className="mono">
      {value.toFixed(decimals)}
    </span>
  );
}
