import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeatureMarquee } from "@/components/marketing/feature-marquee";
import { GetStartedButton } from "@/components/marketing/get-started-button";
import { FallingTestimonials } from "@/components/marketing/falling-testimonials";
import { ArrowUpRight } from "lucide-react";

function HeroMockup() {
  const bars = [34, 52, 40, 66, 58, 78, 70, 88, 76, 96, 84, 100];
  const rows = [
    ["Competitor analysis", "▰▰▰▰▰▰▰▰▱▱", "Trending"],
    ["Script draft #28", "▰▰▰▰▰▰▱▱▱▱", "In review"],
    ["Thumbnail A/B test", "▰▰▰▰▱▱▱▱▱▱", "Optimizing"],
    ["Scheduled publish", "▰▰▰▰▰▰▰▰▰▱", "Tomorrow"],
  ];

  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="overflow-hidden rounded-lg border border-line bg-paper-high shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="h-2 w-2 rounded-full bg-line-strong" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            Agent activity — live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3">
          {[
            ["Subscribers", "124,500", "+3.2%"],
            ["Views · 30d", "1.8M", "+12.5%"],
            ["Est. revenue", "$4,280", "+8.1%"],
          ].map(([label, value, delta]) => (
            <div key={label} className="border-b border-line px-5 py-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-ink-faint">
                {label}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-2xl font-semibold text-ink">{value}</p>
                <span className="text-xs font-medium text-green-600">{delta}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-2">
          <div className="bg-paper-high px-5 pb-5 pt-6">
            <div className="mb-4 flex items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-green-500/70"
                  style={{ height: `${h * 0.7}px` }}
                />
              ))}
            </div>
            <p className="text-[11px] uppercase tracking-wider text-ink-faint">
              Views over time
            </p>
          </div>
          <div className="bg-paper-high px-5 pb-5 pt-6">
            <ul className="space-y-3">
              {rows.map(([label, spark, status]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-ink-soft">{label}</span>
                  <span className="font-mono text-xs text-ink-faint">{spark}</span>
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-gold-600">
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-between text-xs text-ink-faint">
        <span>Illustrative preview — actual data connects to your YouTube channel.</span>
        <span className="font-mono">v1.0</span>
      </p>
    </div>
  );
}

function Hero() {
  return (
    <section className="grain-overlay relative overflow-hidden border-b border-line">
      <div className="container-wide pt-20 pb-16 sm:pt-28 sm:pb-20">
        <span className="eyebrow">Autonomous YouTube channel management</span>

        <div className="mt-8 max-w-3xl">
          <h1 className="display text-balance text-[2.75rem] leading-[1.06] sm:text-[4.25rem] sm:leading-[1.04]">
            Let AI run your{" "}
            <em className="font-display font-normal italic">YouTube channel</em>.
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-ink-soft">
            Connect once. The agent handles research, scripting, production,
            publishing, and optimization around the clock — you just approve.
          </p>

          <div className="shrink-0 md:pb-1">
            <div className="flex flex-col gap-3 sm:flex-row">
              <GetStartedButton />
              <Link href="/#how-it-works">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  See how it works
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              14-day free trial · Cancel anytime
            </p>
          </div>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function TrustedBy() {
  const stats = [
    ["2.4M+", "Videos published"],
    ["340%", "Average growth"],
    ["12,000+", "Active channels"],
    ["99.9%", "Uptime"],
  ];

  return (
    <section className="section-padding bg-paper">
      <div className="container-wide">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {stats.map(([value, label], i) => (
            <div
              key={label}
              className={i === 0 ? "" : "md:border-l md:border-line md:pl-8"}
            >
              <p className="font-display text-4xl font-semibold text-ink sm:text-5xl">
                {value}
              </p>
              <p className="mt-2 text-sm text-ink-mute">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center text-center">
          <span className="eyebrow eyebrow--gold">Trusted by growing creators</span>
          <h2 className="display mt-5 max-w-2xl text-balance text-display-md">
            Creators hand us the keys. The numbers follow.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-mute">
            Real channels, real growth. Here&apos;s what a few of our creators
            say after handing their channels over to the agent.
          </p>
        </div>

        <div className="mt-8">
          <FallingTestimonials />
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section className="section-padding-tight border-t border-line bg-paper-high">
      <div className="container-wide flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-lg">
          <span className="eyebrow">Simple, transparent pricing</span>
          <h2 className="display mt-5 text-display-md">
            Start free. Scale as you grow.
          </h2>
        </div>
        <Link href="/pricing">
          <Button variant="gold" size="lg">
            View all plans
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeatureMarquee />
      <TrustedBy />
      <PricingTeaser />
    </>
  );
}
