"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";

interface Step {
  index: number;
  title: string;
  front: string;
  back: string;
  points: string[];
}

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const [flipped, setFlipped] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);

  const steps: Step[] = [
    {
      index: 0,
      title: t("step1Title"),
      front: t("step1Desc"),
      back: "Connect your YouTube channel through a secure OAuth flow. We request only the permissions required to manage your content, and you can revoke access at any time.",
      points: [
        "Secure Google OAuth connection",
        "Minimal, transparent permission scopes",
        "Revoke access anytime from settings",
      ],
    },
    {
      index: 1,
      title: t("step2Title"),
      front: t("step2Desc"),
      back: "Once connected, the agent studies your audience, competitors, and trending topics. It builds a data-driven content strategy tailored to your niche and market.",
      points: [
        "Competitor & trend research",
        "Audience insight analysis",
        "A strategy shaped to your niche",
      ],
    },
    {
      index: 2,
      title: t("step3Title"),
      front: t("step3Desc"),
      back: "Scripts, thumbnails, and videos are produced automatically on a schedule. Everything lands in your review queue — approve with a single click, or request changes.",
      points: [
        "Scripts, thumbnails & video drafts",
        "Scheduled production pipeline",
        "One-click approval workflow",
      ],
    },
    {
      index: 3,
      title: t("step4Title"),
      front: t("step4Desc"),
      back: "The agent measures real performance and continuously refines titles, tags, and posting times. It learns what works for your audience and compounds the results.",
      points: [
        "Performance-based optimization",
        "A/B tested titles & metadata",
        "Compounding, hands-off growth",
      ],
    },
  ];

  function goTo(index: number) {
    setCurrent(index);
    setFlipped(index);
  }

  function nextStep() {
    const next = (current + 1) % steps.length;
    setCurrent(next);
    setFlipped(next);
  }

  function prevStep() {
    const prev = (current - 1 + steps.length) % steps.length;
    setCurrent(prev);
    setFlipped(prev);
  }

  return (
    <section id="how-it-works" className="section-padding bg-paper grain-overlay">
      <div className="container-wide">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="eyebrow">{t("title")}</span>
            <h2 className="display mt-5 text-display-lg">{t("subtitle")}</h2>
          </div>
          <div className="flex items-center gap-5">
            <span className="font-mono text-xs text-ink-faint">
              {String(current + 1).padStart(2, "0")} /{" "}
              {String(steps.length).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={prevStep}
                aria-label="Previous step"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink active:bg-paper-low"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextStep}
                aria-label="Next step"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink active:bg-paper-low"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const isFlipped = flipped === step.index;
            const isCurrent = current === step.index;
            return (
              <div key={step.index} className="perspective-1000 h-[380px]">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setCurrent(step.index);
                    setFlipped(isFlipped ? null : step.index);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCurrent(step.index);
                      setFlipped(isFlipped ? null : step.index);
                    }
                  }}
                  className={cn(
                    "relative block h-full w-full cursor-pointer preserve-3d text-left transition-transform duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                    isFlipped && "rotate-y-180"
                  )}
                  aria-pressed={isFlipped}
                >
                  {/* Front */}
                  <div
                    className={cn(
                      "absolute inset-0 backface-hidden flex flex-col rounded-lg border bg-paper-high p-7 transition-colors",
                      isCurrent && !isFlipped
                        ? "border-ink"
                        : "border-line hover:border-ink-soft"
                    )}
                  >
                    <span className="mb-auto font-display text-5xl font-light text-green-600">
                      {String(step.index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mb-3 font-display text-xl font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-mute">
                      {step.front}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                      Tap to learn more
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col rounded-lg border border-ink bg-ink p-7 text-paper-high">
                    <h3 className="mb-4 font-display text-xl font-semibold">
                      {step.title}
                    </h3>
                    <p className="mb-5 text-sm leading-relaxed text-paper/80">
                      {step.back}
                    </p>
                    <ul className="mb-auto space-y-2">
                      {step.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-xs text-paper/70">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-400" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    {step.index < steps.length - 1 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextStep();
                        }}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-green-300 transition-colors hover:text-green-200"
                      >
                        Next step
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goTo(0);
                        }}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-green-300 transition-colors hover:text-green-200"
                      >
                        Start over
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
