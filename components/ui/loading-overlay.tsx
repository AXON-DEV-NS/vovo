"use client";

import { useEffect, useRef } from "react";
import { useLoadingStore } from "@/lib/loading-store";

const TEXT = "VOVO AGENT AI";

function SpiralRow({
  reverse = false,
  tone = "ink",
}: {
  reverse?: boolean;
  tone?: "ink" | "gold";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let angle = 360;

    const tick = () => {
      angle -= 1;
      const chars = ref.current?.children;
      if (chars) {
        for (let i = 0; i < chars.length; i++) {
          const el = chars[i] as HTMLElement;
          const phase = (angle - i * 22.5) * (Math.PI / 120);
          const y = Math.sin(phase) * 11;
          const scale = Math.cos(phase) * 0.25 + 0.75;
          el.style.transform = `translateY(${reverse ? -y : y}px) scale(${scale})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  return (
    <div
      ref={ref}
      className="flex items-center justify-center gap-[2px] sm:gap-[3px]"
      aria-hidden="true"
    >
      {TEXT.split("").map((char, i) => (
        <span
          key={i}
          className={
            tone === "gold"
              ? "vovo-spiral-char vovo-spiral-char--gold"
              : "vovo-spiral-char"
          }
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

/**
 * Branded glassmorphism loading overlay — matches the site identity:
 * cream paper glass, ink wordmark, green + gold accents.
 */
export function LoadingOverlay() {
  const active = useLoadingStore((s) => s.active);
  const clear = useLoadingStore((s) => s.clear);

  // Safety valve: an overlay must never get stuck.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => clear(), 10_000);
    return () => clearTimeout(t);
  }, [active, clear]);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-5 bg-paper/65 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper-high/80 px-8 py-7 shadow-card">
        <SpiralRow />
        <SpiralRow reverse tone="gold" />
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.35em] text-ink-mute">
          Loading
        </span>
      </div>
    </div>
  );
}
