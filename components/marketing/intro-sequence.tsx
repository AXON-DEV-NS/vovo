"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { PIPELINE_STAGES, PIPELINE_COUNT } from "@/lib/pipeline";

/**
 * IntroSequence — the cinematic production story shown on EVERY fresh page
 * load across the whole site (marketing, auth, dashboard). Internal
 * client-side navigation between pages does not replay it because the root
 * layout stays mounted.
 *
 * Sequence (the real pipeline order):
 *   Connect channel → Identify content → Research → Produce →
 *   Verify & optimize → Publish → Post-publish check
 *
 * Always plays — the user can skip at any moment via the “Skip” button.
 */

const STEP_MS = 1200;

export function IntroSequence() {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      sessionStorage.setItem("vovo_intro_seen", "true");
    } catch {
      // ignore storage errors
    }
    setLeaving(true);
    window.setTimeout(() => setState("done"), 650);
  }

  useEffect(() => {
    // Check if user already saw the intro this session or prefers reduced motion
    try {
      if (sessionStorage.getItem("vovo_intro_seen") === "true") {
        setState("done");
        return;
      }
    } catch {
      // ignore
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try {
        sessionStorage.setItem("vovo_intro_seen", "true");
      } catch {
        // ignore
      }
      setState("done");
      return;
    }

    setState("running");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (state !== "running") return;
    const t = window.setInterval(() => {
      setStep((s) => {
        if (s + 1 >= PIPELINE_COUNT) {
          window.clearInterval(t);
          window.setTimeout(finish, 650);
          return s;
        }
        return s + 1;
      });
    }, STEP_MS);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state === "done") return null;

  const Active = PIPELINE_STAGES[step];
  const Icon = Active.icon;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-paper transition-opacity duration-700 ease-out",
        leaving && "pointer-events-none opacity-0"
      )}
      role="dialog"
      aria-label="VOVO Agent AI"
    >
      {/* Brand aurora behind the sequence */}
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

      {/* Step content */}
      <div
        key={step}
        className="animate-fade-up relative z-10 flex flex-col items-center px-6 text-center"
      >
        <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-line bg-paper-high shadow-card">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-green-500 to-green-700 text-paper-high shadow-lift">
            <Icon className="h-9 w-9" strokeWidth={1.7} />
          </div>
        </div>

        <h2 className="mt-8 max-w-xl text-2xl font-semibold leading-snug text-ink sm:text-3xl">
          {Active.label}
        </h2>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-mute">
          {Active.description}
        </p>
      </div>

      {/* Progress segments */}
      <div className="absolute bottom-12 z-10 flex items-center gap-2" aria-hidden="true">
        {PIPELINE_STAGES.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i < step ? "w-8 bg-green-300" : i === step ? "w-12 bg-green-600" : "w-6 bg-line"
            )}
          />
        ))}
      </div>
    </div>
  );
}
