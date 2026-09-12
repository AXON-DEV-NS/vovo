export interface PlanInfo {
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

export const PLANS: PlanInfo[] = [
  {
    id: "starter",
    name: "Starter",
    desc: "Perfect for individual creators getting started with AI-powered growth.",
    monthlyPrice: 29,
    yearlyPrice: 23,
    channels: "1 channel",
    videos: "10 AI videos/month",
    analytics: "Basic analytics",
    features: [
      "AI script writing",
      "Auto thumbnail generation",
      "Publishing scheduler",
      "Email support",
    ],
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    desc: "For serious creators ready to scale their content operation.",
    monthlyPrice: 79,
    yearlyPrice: 63,
    channels: "3 channels",
    videos: "40 AI videos/month",
    analytics: "Advanced analytics",
    features: [
      "Everything in Starter",
      "Competitor analysis",
      "A/B testing",
      "Priority support",
      "Custom brand voice",
    ],
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    desc: "For teams and agencies managing multiple client channels.",
    monthlyPrice: 199,
    yearlyPrice: 159,
    channels: "10 channels",
    videos: "Unlimited AI videos",
    analytics: "Full analytics suite",
    features: [
      "Everything in Growth",
      "Team collaboration",
      "White-label reports",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
    ],
    popular: false,
  },
];

export function getPlan(id: string | null): PlanInfo {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

export function getPlanPrice(plan: PlanInfo, billing: "monthly" | "yearly"): number {
  return billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export const TRIAL_DAYS = 14;
