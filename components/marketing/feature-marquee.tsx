"use client";

import { useTranslations } from "next-intl";
import {
  BarChart3,
  Zap,
  TrendingUp,
  ShieldCheck,
  Radar,
  CalendarClock,
  LineChart,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: Radar,
    title: "Trend Detection",
    desc: "Spots rising topics in your niche before they peak, so you publish first.",
  },
  {
    icon: BarChart3,
    title: "Competitor Analysis",
    desc: "Tracks your competitors' top content and finds the gaps you can own.",
  },
  {
    icon: Zap,
    title: "Automatic Production",
    desc: "Scripts, thumbnails, and edits produced end-to-end on your schedule.",
  },
  {
    icon: CalendarClock,
    title: "Publishing Scheduler",
    desc: "Publishes at the optimal time for your audience — automatically.",
  },
  {
    icon: TrendingUp,
    title: "Continuous Optimization",
    desc: "A/B tests titles, tags, and thumbnails against real performance data.",
  },
  {
    icon: LineChart,
    title: "Performance Analytics",
    desc: "Clear, actionable reporting on what's working and what to change.",
  },
  {
    icon: Layers,
    title: "Multi-Channel Management",
    desc: "Run several channels from one dashboard, each with its own strategy.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Security",
    desc: "Encrypted credentials and strict access controls, always in your control.",
  },
];

export function FeatureMarquee() {
  const t = useTranslations("features");

  const cards = [...features, ...features];

  return (
    <section
      id="features"
      className="section-padding relative bg-ink text-paper-high"
    >
      <div className="container-wide mb-14">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="eyebrow !text-green-300">{t("title")}</span>
            <h2 className="display mt-5 text-display-lg">{t("subtitle")}</h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-paper/50">
            A rolling view of the capabilities working behind every connected
            channel — from first idea to published video.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />

        <div className="flex w-max animate-marquee gap-5">
          {cards.map((feature, i) => (
            <div
              key={i}
              className="w-80 shrink-0 rounded-lg border border-paper/10 bg-paper/5 px-7 py-8"
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md bg-green-500/15 text-green-300">
                <feature.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-paper-high">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-paper/70">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
