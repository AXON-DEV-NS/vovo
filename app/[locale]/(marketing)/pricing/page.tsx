"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  PricingCard,
  type PeelState,
  type Plan,
} from "@/components/marketing/pricing-card";
import { ChevronDown } from "lucide-react";

function FAQItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        className="relative flex w-full items-center justify-between overflow-hidden py-5 text-left"
        aria-expanded={open}
      >
        <span
          className={cn(
            "block pr-4 text-sm font-medium text-ink transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            open
              ? "-translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          )}
        >
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-faint transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="mb-5 rounded-lg bg-ink px-6 py-5">
            <p className="text-sm leading-relaxed text-paper/85">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [annual, setAnnual] = useState(false);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [peel, setPeel] = useState<PeelState | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Guests must create an account before checkout — subscriptions are always
  // bound to a real account.
  useEffect(() => {
    fetch("/api/billing/status")
      .then((res) => setAuthed(res.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!peel) return;
    const timer = window.setTimeout(() => setPeel(null), 1000);
    return () => window.clearTimeout(timer);
  }, [peel]);

  function handleToggle(next: boolean) {
    if (next === annual) return;
    setPeel({ token: Date.now(), prevAnnual: annual });
    setAnnual(next);
    setFlippedId(null);
  }

  const [plans, setPlans] = useState<Plan[]>([
    {
      id: "starter",
      name: t("starter.name"),
      desc: t("starter.desc"),
      monthlyPrice: 29,
      yearlyPrice: 23,
      channels: t("starter.channels"),
      videos: t("starter.videos"),
      analytics: t("starter.analytics"),
      features: t.raw("starter.features") as string[],
      popular: false,
    },
    {
      id: "growth",
      name: t("growth.name"),
      desc: t("growth.desc"),
      monthlyPrice: 79,
      yearlyPrice: 63,
      channels: t("growth.channels"),
      videos: t("growth.videos"),
      analytics: t("growth.analytics"),
      features: t.raw("growth.features") as string[],
      popular: true,
    },
    {
      id: "agency",
      name: t("agency.name"),
      desc: t("agency.desc"),
      monthlyPrice: 199,
      yearlyPrice: 159,
      channels: t("agency.channels"),
      videos: t("agency.videos"),
      analytics: t("agency.analytics"),
      features: t.raw("agency.features") as string[],
      popular: false,
    },
  ]);

  // Load live plan names/prices (editable by the owner in the admin panel).
  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((d) => {
        if (d.plans && d.plans.length) setPlans(d.plans);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="section-padding">
      <div className="container-page">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="eyebrow">{t("title")}</span>
          <h1 className="display mt-5 text-display-lg">{t("subtitle")}</h1>
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-line bg-paper-high p-1">
            <button
              onClick={() => handleToggle(false)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                !annual ? "bg-ink text-paper-high" : "text-ink-mute hover:text-ink"
              )}
            >
              {t("monthly")}
            </button>
            <button
              onClick={() => handleToggle(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                annual ? "bg-ink text-paper-high" : "text-ink-mute hover:text-ink"
              )}
            >
              {t("yearly")}
              <Badge variant="gold">{t("yearlyDiscount")}</Badge>
            </button>
          </div>
        </div>

        <div className="mx-auto mb-20 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              annual={annual}
              authed={authed === true}
              flipped={flippedId === plan.id}
              onFlip={() =>
                setFlippedId((prev) => (prev === plan.id ? null : plan.id))
              }
              peel={peel}
            />
          ))}
        </div>

        <div className="mx-auto max-w-2xl">
          <h2 className="display mb-8 text-center text-display-md">
            {t("faq.title")}
          </h2>
          <div className="divide-y divide-line border-t border-line">
            {[0, 1, 2, 3, 4].map((i) => (
              <FAQItem
                key={i}
                question={t(`faq.questions.${i}.question`)}
                answer={t(`faq.questions.${i}.answer`)}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
