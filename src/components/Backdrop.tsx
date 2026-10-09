"use client";

import { motion } from "framer-motion";

const ROWS = Array.from({ length: 6 });
const GPU = { willChange: "transform" } as const;

function Sparkle({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      className={`absolute ${className}`}
      style={GPU}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 3, repeat: Infinity, delay }}
    >
      <path d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z" fill="#fff4e3" />
    </motion.svg>
  );
}

function Pin({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 60 160" className={className} aria-hidden>
      <path
        d="M30 2c-9 0-13 8-12 17 1 7 5 11 3 18-2 6-14 20-14 45 0 22 8 34 8 48 0 7 3 14 15 14s15-7 15-14c0-14 8-26 8-48 0-25-12-39-14-45-2-7 2-11 3-18 1-9-3-17-12-17z"
        fill="#fff4e3"
        stroke="#1a0d0d"
        strokeWidth="3"
      />
      <path d="M19 42c8 4 14 4 22 0M17 52c9 4 17 4 26 0" stroke="#d4202b" strokeWidth="5" fill="none" />
    </svg>
  );
}

function Ball({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="58" fill="#241a3a" stroke="#1a0d0d" strokeWidth="3" />
      <ellipse cx="40" cy="32" rx="16" ry="9" fill="#fff" opacity="0.18" transform="rotate(-30 40 32)" />
      <circle cx="62" cy="40" r="5" fill="#0d0710" />
      <circle cx="78" cy="48" r="5" fill="#0d0710" />
      <circle cx="68" cy="58" r="5" fill="#0d0710" />
    </svg>
  );
}

function Zebra({ className, rotate }: { className: string; rotate: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        rotate,
        ...GPU,
        background:
          "repeating-linear-gradient(45deg, #1a0d0d 0 14px, #fff4e3 14px 28px)",
        borderRadius: "46% 54% 40% 60% / 55% 40% 60% 45%",
      }}
      animate={{ rotate: [rotate, rotate + 4, rotate] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-brand-coral">
      {/* Capa estática: se pinta una sola vez y queda en su propia capa de GPU */}
      <div className="absolute inset-0" style={{ transform: "translateZ(0)", ...GPU }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, #f8bd2c55 0, transparent 40%), radial-gradient(circle at 90% 90%, #a8131d99 0, transparent 50%)",
        }}
      />

      {/* Texto gigante repetido */}
      <div
        aria-hidden
        className="absolute -left-40 -top-40 w-[200vw] -rotate-12 select-none font-black leading-[0.9] tracking-tighter"
      >
        {ROWS.map((_, i) => (
          <p
            key={i}
            className="whitespace-nowrap text-[9rem]"
            style={{ color: "rgba(168, 19, 29, 0.22)", marginLeft: i % 2 ? "-12rem" : 0 }}
          >
            ILUSION BOWL ILUSION BOWL ILUSION BOWL ILUSION BOWL
          </p>
        ))}
      </div>
      </div>

      <Zebra className="-left-24 bottom-[-6rem] h-72 w-80" rotate={-18} />
      <Zebra className="-right-24 -top-20 h-64 w-72" rotate={25} />

      {/* Zigzags amarillos */}
      <motion.svg
        viewBox="0 0 120 60"
        className="absolute left-[6%] top-[8%] w-28"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <polyline points="5,50 30,10 55,50 80,10 105,50" fill="none" stroke="#f8bd2c" strokeWidth="12" strokeLinejoin="miter" />
      </motion.svg>
      <motion.svg
        viewBox="0 0 120 60"
        className="absolute bottom-[10%] right-[10%] w-24 rotate-12"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <polyline points="5,50 30,10 55,50 80,10 105,50" fill="none" stroke="#f8bd2c" strokeWidth="12" strokeLinejoin="miter" />
      </motion.svg>

      <Sparkle className="left-[22%] top-[30%] w-8" />
      <Sparkle className="right-[18%] top-[18%] w-10" delay={1} />
      <Sparkle className="bottom-[22%] left-[12%] w-7" delay={2} />
      <Sparkle className="bottom-[35%] right-[6%] w-6" delay={0.6} />

      {/* Pinos y bola */}
      <motion.div
        className="absolute -right-4 top-[22%] hidden w-24 rotate-[25deg] sm:block"
        animate={{ y: [0, -14, 0], rotate: [25, 30, 25] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Pin className="w-full" />
      </motion.div>
      <motion.div
        className="absolute bottom-[8%] left-[4%] hidden w-16 -rotate-[20deg] sm:block"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <Pin className="w-full" />
      </motion.div>
      <motion.div
        className="absolute -bottom-10 right-[-2rem] w-44 sm:w-56"
        style={GPU}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <Ball className="w-full" />
      </motion.div>
    </div>
  );
}
