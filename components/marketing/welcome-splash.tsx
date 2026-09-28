"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Workflow, ShieldCheck, X } from "lucide-react";

/**
 * WelcomeSplash — the one-time first-visit walkthrough.
 *
 * Shown exactly ONCE per account (persisted on the user record, consistent
 * across devices and refreshes), right after the first sign-in. It renders as
 * a non-blocking overlay: the app loads underneath and the user can dismiss it
 * at any moment with “Get Started” or “Skip”.
 *
 * Matching the existing brand language: paper/ink/green palette, Fraunces
 * headings, the same icon-tile treatment as the onboarding cards.
 */

interface Slide {
  icon: typeof Workflow;
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: Workflow,
    eyebrow: "Welcome",
    title: "Your channel, on autopilot",
    body: "Connect a channel and pick your content type. The agent researches, scripts, produces, and schedules every video — end to end.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "You stay in control",
    title: "Review before anything publishes",
    body: "Every video passes a compliance gate and waits for your approval. Your custom AI instructions guide each script.",
  },
];

export function WelcomeSplash() {
  const [state, setState] = useState<"checking" | "hidden" | "visible" | "leaving">("checking");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboarding/state")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d?.ok && d.welcomeSeen === false) {
          setState("visible");
        } else {
          setState("hidden");
        }
      })
      .catch(() => {
        if (!cancelled) setState("hidden");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function finish() {
    setState("leaving");
    fetch("/api/onboarding/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ welcomeSeen: true }),
    }).catch(() => {});
    window.setTimeout(() => setState("hidden"), 450);
  }

  if (state === "checking" || state === "hidden") return null;

  const slide = SLIDES[index];
  const Icon = slide.icon;
  const last = index === SLIDES.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Welcome to VOVO Agent AI"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-paper transition-opacity duration-500 ease-out",
        state === "leaving" && "pointer-events-none opacity-0"
      )}
    >
      {/* Brand aurora */}
      <div className="hero-aurora" aria-hidden="true">
        <div className="hero-aurora-blob hero-aurora-blob--green" />
        <div className="hero-aurora-blob hero-aurora-blob--gold" />
        <div className="hero-aurora-blob hero-aurora-blob--ink" />
      </div>

      {/* Logo top-left */}
      <div className="absolute left-6 top-6 z-10 sm:left-8 sm:top-8">
        <Logo />
      </div>

      {/* Skip */}
      <button
        onClick={finish}
        className="absolute right-6 top-6 z-10 flex items-center gap-1.5 rounded-full border border-line bg-paper-high px-4 py-2 text-xs font-medium text-ink-mute transition-colors hover:text-ink"
      >
        Skip
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Slide */}
      <div key={index} className="animate-fade-up relative z-10 flex flex-col items-center px-6 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-line bg-paper-high shadow-card">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-green-500 to-green-700 text-paper-high shadow-lift">
            <Icon className="h-9 w-9" strokeWidth={1.7} />
          </div>
        </div>

        <span className="eyebrow eyebrow--gold mt-8">{slide.eyebrow}</span>
        <h2 className="display mt-3 max-w-xl text-2xl font-semibold leading-snug text-ink sm:text-3xl">
          {slide.title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-mute">{slide.body}</p>

        <div className="mt-8 flex items-center gap-3">
          <Button variant="green" size="lg" onClick={() => (last ? finish() : setIndex((i) => i + 1))}>
            {last ? "Get Started" : "Next"}
          </Button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-12 z-10 flex items-center gap-2" aria-hidden="true">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === index ? "w-12 bg-green-600" : "w-6 bg-line"
            )}
          />
        ))}
      </div>
    </div>
  );
}
