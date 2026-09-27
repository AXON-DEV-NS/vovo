"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useLoadingStore } from "@/lib/loading-store";
import {
  PIPELINE_STAGES,
  PIPELINE_COUNT,
  PIPELINE_STEP,
} from "@/lib/pipeline";

const RING_SIZE = 208; // px
const ORBIT_R = 78; // px
const TILT = 26; // deg
const MS_PER_STAGE = 500;
export const LOADER_MIN_MS = PIPELINE_COUNT * MS_PER_STAGE; // one full loop

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * PipelineLoader — a refined 3D production cycle.
 *
 * Every load walks through ALL stages IN ORDER (none skipped):
 * the active icon glides to the front, lights up, its label is shown, the
 * gold arc fills one segment, then the ring eases to the next stage. The
 * real site logo sits at the core, front icons are crisp and embossed,
 * back icons carry a subtle depth-of-field blur.
 */
function PipelineLoader() {
  const [step, setStep] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepRef = useRef(0);
  const stepStartRef = useRef(0);

  // Sequential stage advancing — every stage gets its turn, in order.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStep(PIPELINE_COUNT - 1);
      return;
    }
    const t = window.setInterval(() => {
      setStep((s) => (s + 1) % PIPELINE_COUNT);
    }, MS_PER_STAGE);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    stepRef.current = step;
    stepStartRef.current = performance.now();
  }, [step]);

  // Smooth eased orbit synced to the active stage.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;

    const tick = (now: number) => {
      const k = stepRef.current;
      const raw = Math.min((now - stepStartRef.current) / MS_PER_STAGE, 1);
      const ease = easeInOutCubic(raw);
      // Ring rotation places stage `k` at the front, gliding toward k+1.
      const rot = Math.PI / 2 - (k + ease) * PIPELINE_STEP;

      for (let i = 0; i < PIPELINE_COUNT; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const phi = rot + i * PIPELINE_STEP;
        const depth = (Math.sin(phi) + 1) / 2;
        const x = Math.cos(phi) * ORBIT_R;
        const y = Math.sin(phi) * ORBIT_R;
        const scale = 0.86 + depth * 0.2;

        el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotateX(${-TILT}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = (0.45 + depth * 0.55).toFixed(3);
        el.style.filter = depth < 0.32 ? "blur(0.9px)" : "none";
        el.style.zIndex = String(10 + Math.round(depth * 100));
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const active = PIPELINE_STAGES[step];
  const circumference = 2 * Math.PI * 98;
  const progress = ((step + 1) / PIPELINE_COUNT) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 3D orbit */}
      <div
        className="relative"
        style={{ width: RING_SIZE, height: RING_SIZE, perspective: "900px" }}
      >
        {/* progress arc (flat, behind the orbit) */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="loader-arc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#335433" />
              <stop offset="100%" stopColor="#C0851F" />
            </linearGradient>
          </defs>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={98}
            fill="none"
            stroke="#E3DAC5"
            strokeWidth="2"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={98}
            fill="none"
            stroke="url(#loader-arc)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 380ms ease-out" }}
          />
        </svg>

        {/* Real site logo at the core */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 -m-2 animate-ping rounded-3xl bg-gold-400/20" />
          <span className="absolute inset-0 -m-1.5 rounded-3xl bg-gradient-to-br from-green-500/30 to-gold-400/30 blur-[2px]" />
          <img
            src="/vovo25.jpg"
            alt="VOVO Agent AI"
            width={52}
            height={52}
            className="relative h-[52px] w-[52px] rounded-2xl object-cover shadow-card ring-1 ring-line"
          />
        </div>

        {/* tilted rotating orbit */}
        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", transform: `rotateX(${TILT}deg)` }}
        >
          {/* orbit track (becomes an ellipse in the tilted plane) */}
          <div
            className="absolute left-1/2 top-1/2 h-[156px] w-[156px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line"
            aria-hidden="true"
          />

          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isActive = i === step;
            return (
              <div
                key={stage.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={cn(
                  "absolute left-1/2 top-1/2 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
                  isActive
                    ? "scale-105 border-green-600 bg-gradient-to-br from-green-500 to-green-700 text-paper-high shadow-[0_10px_26px_rgba(51,84,51,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
                    : "border-line bg-paper-high text-ink-soft shadow-soft"
                )}
                style={{ willChange: "transform, opacity, filter" }}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </div>
            );
          })}
        </div>
      </div>

      {/* active stage label */}
      <div className="flex h-6 items-center justify-center">
        <p
          key={step}
          className="animate-fade-in text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft"
        >
          {active.label}
        </p>
      </div>
    </div>
  );
}

/**
 * Branded glassmorphism loading overlay.
 *
 * Timing guarantees:
 * - The overlay NEVER finishes before one full loop (all stages shown in
 *   order) — even if the page arrives early.
 * - If the page is slow, it keeps loading normally (hard ceiling 45s).
 */
export function LoadingOverlay() {
  const active = useLoadingStore((s) => s.active);
  const [show, setShow] = useState(false);
  const shownAtRef = useRef(0);

  useEffect(() => {
    if (active) {
      if (!shownAtRef.current) shownAtRef.current = Date.now();
      setShow(true);
      return;
    }
    if (!shownAtRef.current) return;
    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, LOADER_MIN_MS - elapsed);
    const t = window.setTimeout(() => {
      setShow(false);
      shownAtRef.current = 0;
    }, remaining);
    return () => window.clearTimeout(t);
  }, [active]);

  // Hard ceiling against a genuinely stuck overlay (very slow page).
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => {
      setShow(false);
      shownAtRef.current = 0;
    }, 45_000);
    return () => window.clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-paper/60 backdrop-blur-md"
    >
      <PipelineLoader />
    </div>
  );
}
