"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Hand the agent your research, scripting, production, and publishing. You stay in control with a single approval click.",
    author: "Autonomous pipeline",
    role: "Eight stages · end to end",
  },
  {
    quote:
      "Every video passes a mandatory compliance review against current YouTube policy before any asset is produced.",
    author: "Compliance-first",
    role: "Gates before generation",
  },
  {
    quote:
      "Trend and competitor research feeds a shared niche knowledge base — every channel learns from what the platform discovers.",
    author: "Shared intelligence",
    role: "Niche memory · compounding",
  },
];

const CYCLE_MS = 7000;

export function FallingTestimonials() {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, CYCLE_MS);
    return () => window.clearTimeout(timer);
  }, [index]);

  return (
    <div className="relative h-[420px] overflow-hidden sm:h-[460px]">
      <div
        className="absolute inset-x-0 top-0 flex justify-center"
        style={{ perspective: "1000px" }}
      >
        <div
          key={index}
          className="testimonial-card-fall relative h-[300px] w-[min(340px,calc(100vw-3rem))] sm:h-[320px] sm:w-[360px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Back — solid black, logo mark face-down */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink shadow-card"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Logo variant="paper" size="lg" />
          </div>

          {/* Front — testimonial, face-up */}
          <div
            className="absolute inset-0 flex flex-col rounded-xl border border-line bg-paper-high p-7 shadow-card"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="mb-2 font-display text-5xl leading-none text-gold-400/60">
              &ldquo;
            </span>
            <blockquote className="text-pretty text-[15px] leading-relaxed text-ink-soft">
              {t.quote}
            </blockquote>
            <figcaption className="mt-auto flex items-center gap-3 border-t border-line pt-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-semibold text-green-700">
                {t.author.charAt(0)}
              </span>
              <span className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{t.author}</p>
                <p className="truncate text-xs text-ink-faint">{t.role}</p>
              </span>
            </figcaption>
          </div>
        </div>
      </div>
    </div>
  );
}
