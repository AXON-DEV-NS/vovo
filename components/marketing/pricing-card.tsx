"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Check, Rotate3d } from "lucide-react";

export interface Plan {
  id: string;
  name: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  channels: string;
  videos: string;
  analytics: string;
  features: string[];
  popular: boolean;
}

export interface PeelState {
  token: number;
  prevAnnual: boolean;
}

const COLS = 6;
const ROWS = 10;
const CELL_COUNT = COLS * ROWS;

const FRONT_MONTHLY = "#FBF7ED";
const FRONT_YEARLY = "#1B1915";
const BACK_MONTHLY = "#1B1915";
const BACK_YEARLY = "#335433";

function PeelCells({ color }: { color: string }) {
  const cells = Array.from({ length: CELL_COUNT }, (_, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const delay = (i * 89) % 360;
    const rot = ((i * 53) % 40) - 20;
    return (
      <div
        key={i}
        className="pointer-events-none absolute"
        style={
          {
            left: `${(col / COLS) * 100}%`,
            top: `${(row / ROWS) * 100}%`,
            width: `${100 / COLS}%`,
            height: `${100 / ROWS}%`,
            backgroundColor: color,
            animation: `peel-off 380ms ${delay}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            "--peel-rot": `${rot}deg`,
          } as React.CSSProperties
        }
      />
    );
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">
      {cells}
    </div>
  );
}

interface PricingCardProps {
  plan: Plan;
  annual: boolean;
  /** true when the visitor already has an account session */
  authed: boolean;
  flipped: boolean;
  onFlip: () => void;
  peel: PeelState | null;
}

export function PricingCard({ plan, annual, authed, flipped, onFlip, peel }: PricingCardProps) {
  const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
  const period = annual ? "/year" : "/month";

  const checkoutPath = `/checkout?plan=${plan.id}&billing=${annual ? "yearly" : "monthly"}`;
  // Guests are sent to sign up first; the return_url brings them straight
  // back to checkout so the subscription binds to their new account.
  const ctaHref = authed
    ? checkoutPath
    : `/login?mode=signup&return_url=${encodeURIComponent(checkoutPath)}`;

  const frontPeelColor = peel
    ? peel.prevAnnual
      ? FRONT_YEARLY
      : FRONT_MONTHLY
    : null;
  const backPeelColor = peel
    ? peel.prevAnnual
      ? BACK_YEARLY
      : BACK_MONTHLY
    : null;

  return (
    <div
      className="relative h-[560px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      style={{ perspective: "1400px" }}
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
      aria-pressed={flipped}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 700ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* ===== FRONT — everything except the price ===== */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col rounded-2xl border p-7",
            annual
              ? "border-paper/10 bg-ink text-paper-high"
              : "border-line bg-paper-high text-ink",
            plan.popular && !annual && "border-gold-400"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {plan.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-3 py-0.5 text-xs font-medium text-ink">
              Most Popular
            </span>
          )}

          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                annual
                  ? "border-paper/20 text-paper/60"
                  : "border-line text-ink-faint"
              )}
              aria-hidden="true"
            >
              <Rotate3d className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              "text-sm leading-relaxed",
              annual ? "text-paper/70" : "text-ink-mute"
            )}
          >
            {plan.desc}
          </p>

          <div
            className={cn(
              "my-5 space-y-2 border-y py-4",
              annual ? "border-paper/15" : "border-line"
            )}
          >
            <p className="text-sm font-medium">{plan.channels}</p>
            <p className="text-sm font-medium">{plan.videos}</p>
            <p className="text-sm font-medium">{plan.analytics}</p>
          </div>

          <div className="space-y-2.5">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    annual ? "text-green-300" : "text-green-600"
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    annual ? "text-paper/80" : "text-ink-soft"
                  )}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <Link href={ctaHref} className="block">
              <Button
                variant={annual ? "gold" : "primary"}
                size="lg"
                className="w-full"
              >
                Start Free Trial
              </Button>
            </Link>
            <p
              className={cn(
                "mt-3 text-center text-[11px] uppercase tracking-wider",
                annual ? "text-paper/40" : "text-ink-faint"
              )}
            >
              Tap the card to reveal pricing
            </p>
          </div>

          {frontPeelColor && <PeelCells color={frontPeelColor} />}
        </div>

        {/* ===== BACK — price only ===== */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center rounded-2xl text-paper-high",
            annual ? "bg-green-600" : "bg-ink"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/50">
            {plan.name}
          </p>
          <div className="mt-5 flex items-baseline justify-center gap-2">
            <span className="font-display text-7xl font-semibold leading-none">
              {`$${price}`}
            </span>
            <span className="text-lg text-paper/60">{period}</span>
          </div>
          <p className="mt-4 text-xs text-paper/50">
            {annual ? "Billed annually" : "Billed monthly"}
          </p>
          <p className="mt-10 text-[11px] uppercase tracking-wider text-paper/40">
            Tap to see what&apos;s included
          </p>

          {backPeelColor && <PeelCells color={backPeelColor} />}
        </div>
      </div>
    </div>
  );
}
