"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Link2, CalendarCheck, BarChart3, X } from "lucide-react";

/**
 * First-visit welcome tour.
 *
 * Shown once per account (persisted on the user record), only after the
 * onboarding is complete. Lightweight, dismissible, and it never blocks the
 * app underneath.
 */
const SLIDES = [
  {
    icon: Link2,
    title: "Connect & configure",
    body: "Your channels, content type, and AI instructions live under Channels and Strategy — update them anytime.",
  },
  {
    icon: CalendarCheck,
    title: "Review before publishing",
    body: "Everything the agent produces lands in the Content Calendar. Approve, request changes, or reject with one click.",
  },
  {
    icon: BarChart3,
    title: "Track real growth",
    body: "Analytics and Settings show only what actually happened — no placeholders, ever.",
  },
];

export function WelcomeTour({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const last = index === SLIDES.length - 1;

  function finish() {
    setClosing(true);
    fetch("/api/onboarding/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourSeen: true }),
    }).catch(() => {});
    window.setTimeout(onDone, 250);
  }

  return (
    <div
      className={cn(
        "fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-sm rounded-2xl border border-line bg-paper-high p-5 shadow-card transition-all duration-300 ease-out sm:inset-x-auto sm:right-6",
        closing && "pointer-events-none translate-y-2 opacity-0"
      )}
      role="dialog"
      aria-label="Welcome tour"
    >
      <button
        onClick={finish}
        aria-label="Skip the tour"
        className="absolute right-3 top-3 rounded-lg p-1 text-ink-faint transition-colors hover:bg-paper-low hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-3 font-semibold text-ink">{slide.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-mute">{slide.body}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-green-600" : "w-1.5 bg-line"
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => (last ? finish() : setIndex((i) => i + 1))}
          >
            {last ? "Got it" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
