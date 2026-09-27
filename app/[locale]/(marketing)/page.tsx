import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeatureMarquee } from "@/components/marketing/feature-marquee";
import { GetStartedButton } from "@/components/marketing/get-started-button";
import { FallingTestimonials } from "@/components/marketing/falling-testimonials";
import { PipelineCarousel } from "@/components/marketing/pipeline-carousel";
import { ArrowUpRight } from "lucide-react";

function Hero() {
  return (
    <section className="grain-overlay relative overflow-hidden border-b border-line">
      <div className="container-wide relative z-10 grid min-h-[calc(100vh-4rem)] items-start gap-8 py-16 lg:grid-cols-2 lg:items-center lg:gap-14 sm:py-20">
        {/* Left — headline & actions */}
        <div className="max-w-xl text-left">
          <h1 className="display text-balance text-[2.75rem] leading-[1.06] sm:text-[4rem] sm:leading-[1.04]">
            Let AI run your{" "}
            <em className="font-display font-normal italic text-green-700">
              YouTube channel
            </em>
            .
          </h1>

          <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-ink-soft">
            Connect once. The agent handles deep research, scripting, production,
            publishing, and optimization around the clock — you just approve.
          </p>

          <div className="mt-9 flex flex-col gap-3.5 sm:flex-row">
            <GetStartedButton />
            <Link href="/#how-it-works">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </Link>
          </div>
        </div>

        {/* Right — unified production-steps carousel */}
        <PipelineCarousel />
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
