"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  CheckCircle2,
  Loader2,
  Sparkles,
  Users,
  TrendingUp,
  Swords,
  Target,
  AlertTriangle,
  UserCircle2,
  ArrowRight,
  Compass,
  CreditCard,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

interface ChannelInfo {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  niche: string | null;
  requiresAvatar: boolean | null;
  avatarSheetUrls: string[];
}

interface Analysis {
  summary: string;
  audience: string[];
  trends: string[];
  competitors: string[];
  opportunities: string[];
  contentAngles: string[];
  risks: string[];
  requiresAvatar: boolean;
  avatarNotes: string;
  dos: string[];
  donts: string[];
  verdict: string;
}

interface PlanView {
  id: string;
  name: string;
  desc?: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features?: string[];
  popular?: boolean;
}

interface AccessStatus {
  hasAccess: boolean;
  status: string;
  planName?: string | null;
  message?: string;
}

const YT_STATUS_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  connected: { text: "YouTube channel connected successfully.", ok: true },
  not_configured: { text: "YouTube connection is not configured yet.", ok: false },
  invalid_state: { text: "The connection request expired. Please try again.", ok: false },
  db_not_configured: { text: "Database is not connected - channel cannot be saved yet.", ok: false },
  no_channel: { text: "No YouTube channel found on this Google account.", ok: false },
  failed: { text: "YouTube connection failed. Please try again.", ok: false },
};

export default function OnboardingPage() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>(1);

  // Subscription
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingAccess, setLoadingAccess] = useState(true);

  // Channels
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);

  // Content
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [description, setDescription] = useState("");
  const [refVideo, setRefVideo] = useState("");
  const [refChannel, setRefChannel] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  // Avatar
  const [avatarUrls, setAvatarUrls] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);

  const ytStatus = params.get("youtube");
  const statusMessage = ytStatus ? YT_STATUS_MESSAGES[ytStatus] : null;

  const loadAll = useCallback(async () => {
    // Access + plans
    try {
      const [accessRes, plansRes] = await Promise.all([
        fetch("/api/billing/status"),
        fetch("/api/plans"),
      ]);
      const accessData = await accessRes.json().catch(() => null);
      const plansData = await plansRes.json().catch(() => ({}));
      if (accessData) setAccess(accessData);
      if (Array.isArray(plansData.plans)) setPlans(plansData.plans);
      if (accessData?.hasAccess) setStep((s) => (s === 1 ? 2 : s));
    } catch {
      // ignore
    } finally {
      setLoadingAccess(false);
    }

    // Channels
    try {
      const res = await fetch("/api/youtube/status");
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.channels)) {
        setChannels(data.channels);
        if (data.channels.length > 0) {
          setStep((s) => (s === 1 || s === 2 ? 3 : s));
          const first = data.channels[0] as ChannelInfo;
          if (first.niche) setNiche(first.niche);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const primaryChannel = channels[0] ?? null;

  async function runAnalysis() {
    if (!niche.trim()) {
      setError("Please enter or choose your content niche first.");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/niche/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche.trim(),
          description: description.trim() || undefined,
          audience: audience.trim() || undefined,
          referenceVideoUrl: refVideo.trim() || undefined,
          referenceChannelUrl: refChannel.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.analysis) {
        setAnalysis(data.analysis as Analysis);
        setStep(4);
      } else {
        setError(data.error || "The analysis failed. Please try again.");
      }
    } catch {
      setError("The analysis failed. Please check your connection.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveAvatar() {
    if (!primaryChannel) return;
    const urls = avatarUrls
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));

    setSavingAvatar(true);
    setError("");
    try {
      const res = await fetch("/api/youtube/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: primaryChannel.id,
          imageUrls: urls,
          requiresAvatar: Boolean(analysis?.requiresAvatar),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setAvatarSaved(true);
        setStep(5);
      } else {
        setError(data.error || "Could not save the reference images.");
      }
    } catch {
      setError("Could not save the reference images.");
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <div>
        <span className="eyebrow">Getting started</span>
        <h1 className="display mt-3 text-3xl font-semibold text-ink">
          Set up your AI-managed channel
        </h1>
        <p className="mt-2 text-sm text-ink-mute">
          Five steps: choose your plan, connect YouTube, define your content,
          confirm your visual identity, and let the agent take over.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= s ? "bg-ink" : "bg-line"
            }`}
          />
        ))}
      </div>

      {statusMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            statusMessage.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* STEP 1 - Subscription */}
      {step === 1 && (
        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-gold-600" />
              1. Choose your plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loadingAccess ? (
              <p className="flex items-center gap-2 text-sm text-ink-mute">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking your subscription...
              </p>
            ) : access?.hasAccess ? (
              <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-emerald-800">
                    Your plan is active{access.planName ? ` - ${access.planName}` : ""}
                  </p>
                  <p className="text-xs text-emerald-700">{access.message}</p>
                </div>
                <Button variant="green" onClick={() => setStep(2)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      billing === "monthly" ? "bg-ink text-paper-high" : "bg-paper-low text-ink-soft"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling("yearly")}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      billing === "yearly" ? "bg-ink text-paper-high" : "bg-paper-low text-ink-soft"
                    }`}
                  >
                    Yearly
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Save 20%
                    </span>
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {plans.map((plan) => {
                    const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                    return (
                      <div
                        key={plan.id}
                        className={`flex flex-col rounded-xl border p-4 ${
                          plan.popular ? "border-gold-300 bg-gold-50/40" : "border-line bg-paper"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-semibold text-ink">{plan.name}</p>
                          {plan.popular && (
                            <Badge className="bg-gold-100 text-gold-800 border-gold-200">Popular</Badge>
                          )}
                        </div>
                        <p className="font-display text-2xl font-semibold text-ink">
                          ${price}
                          <span className="text-xs font-normal text-ink-mute">
                            /{billing === "yearly" ? "yr" : "mo"}
                          </span>
                        </p>
                        <ul className="mt-3 flex-1 space-y-1 text-xs text-ink-mute">
                          {(plan.features ?? []).slice(0, 4).map((f, i) => (
                            <li key={i}>- {f}</li>
                          ))}
                        </ul>
                        <Link
                          href={`/checkout?plan=${plan.id}&billing=${billing}`}
                          className="mt-4 block"
                        >
                          <Button
                            variant={plan.popular ? "gold" : "primary"}
                            className="w-full"
                            size="sm"
                          >
                            Subscribe
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                  {plans.length === 0 && (
                    <p className="text-sm text-ink-mute">
                      Plans are loading. Refresh if they do not appear.
                    </p>
                  )}
                </div>
                <p className="text-xs text-ink-faint">
                  A 14-day free trial starts today - you are not charged until it ends.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2 - Connect YouTube */}
      {step === 2 && (
        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5 text-red-600" />
              2. Connect your YouTube channel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingChannels ? (
              <p className="flex items-center gap-2 text-sm text-ink-mute">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking connected channels...
              </p>
            ) : primaryChannel ? (
              <div className="flex items-center gap-4 rounded-xl border border-line bg-paper p-4">
                {primaryChannel.thumbnailUrl ? (
                  <img
                    src={primaryChannel.thumbnailUrl}
                    alt={primaryChannel.title}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper-high">
                    <Video className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-ink">{primaryChannel.title}</p>
                  <p className="text-xs text-ink-mute">
                    {primaryChannel.subscriberCount.toLocaleString()} subscribers -{" "}
                    {primaryChannel.videoCount.toLocaleString()} videos
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-ink-mute">
                Connect the channel the agent will manage. This grants upload and
                analytics permissions only - you stay in control.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant={primaryChannel ? "secondary" : "primary"}
                onClick={() => {
                  window.location.href = "/api/youtube/connect";
                }}
              >
                <Video className="h-4 w-4" />
                {primaryChannel ? "Reconnect / add another channel" : "Connect YouTube"}
              </Button>
              {primaryChannel && (
                <Button variant="green" onClick={() => setStep(3)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 - Content & market analysis */}
      {step === 3 && (
        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5 text-green-700" />
              3. Define your content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Content niche *
                </label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Tech Reviews & AI, Horror Stories..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Target audience
                </label>
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Arabic-speaking tech enthusiasts 18-34"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                Describe your content (optional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of the style and topics"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Reference video (same content style)
                </label>
                <Input
                  value={refVideo}
                  onChange={(e) => setRefVideo(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                  Competitor channel
                </label>
                <Input
                  value={refChannel}
                  onChange={(e) => setRefChannel(e.target.value)}
                  placeholder="https://youtube.com/@competitor"
                  dir="ltr"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button variant="green" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing market & competitors...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Analyze niche before any video
                </>
              )}
            </Button>
            <p className="text-xs text-ink-faint">
              The strategist searches the live web and studies audience, trends,
              competitors, and market gaps before a single idea is produced.
            </p>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 - Analysis results + avatar */}
      {step === 4 && analysis && (
        <div className="space-y-6">
          <Card className="bg-paper-high border-line shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-700" />
                4. Market analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              {analysis.summary && (
                <p className="leading-relaxed text-ink-soft">{analysis.summary}</p>
              )}
              {analysis.verdict && (
                <div className="rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-gold-800">
                  <strong>Verdict:</strong> {analysis.verdict}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Users, title: "Audience", items: analysis.audience },
                  { icon: TrendingUp, title: "Trends", items: analysis.trends },
                  { icon: Swords, title: "Competitors", items: analysis.competitors },
                  { icon: Target, title: "Opportunities", items: analysis.opportunities },
                ].map(({ icon: Icon, title, items }) => (
                  <div key={title} className="rounded-xl border border-line bg-paper p-4">
                    <p className="mb-2 flex items-center gap-2 font-semibold text-ink">
                      <Icon className="h-4 w-4 text-green-700" /> {title}
                    </p>
                    <ul className="space-y-1 text-xs text-ink-mute">
                      {items.slice(0, 5).map((item, i) => (
                        <li key={i}>- {item}</li>
                      ))}
                      {items.length === 0 && <li>-</li>}
                    </ul>
                  </div>
                ))}
              </div>

              {(analysis.risks.length > 0 || analysis.donts.length > 0) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> Risks & pitfalls to avoid
                  </p>
                  <ul className="space-y-1 text-xs text-amber-800">
                    {[...analysis.risks, ...analysis.donts].slice(0, 6).map((item, i) => (
                      <li key={i}>- {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.dos.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="mb-2 font-semibold text-emerald-800">
                    Proven patterns saved to your niche memory
                  </p>
                  <ul className="space-y-1 text-xs text-emerald-800">
                    {analysis.dos.slice(0, 6).map((item, i) => (
                      <li key={i}>- {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {analysis.requiresAvatar ? (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle2 className="h-5 w-5 text-gold-600" />
                  Visual identity - fixed character required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-ink-soft">
                  This content needs a consistent character across every video.
                  Upload a <strong>Character Turnaround Sheet</strong> (front, back,
                  both sides, expressions, outfit details) - the director persona
                  will keep it identical in every generated scene.
                </p>
                {analysis.avatarNotes && (
                  <div className="rounded-lg border border-line bg-paper px-4 py-3 text-xs text-ink-mute">
                    {analysis.avatarNotes}
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Reference image URLs (one per line)
                  </label>
                  <textarea
                    value={avatarUrls}
                    onChange={(e) => setAvatarUrls(e.target.value)}
                    rows={4}
                    dir="ltr"
                    placeholder={"https://.../front.png\nhttps://.../side.png\nhttps://.../back.png"}
                    className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex flex-wrap gap-3">
                  <Button variant="green" onClick={saveAvatar} disabled={savingAvatar}>
                    {savingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Save visual identity
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(5)}>
                    Skip for now
                  </Button>
                </div>
                <p className="text-xs text-ink-faint">
                  Direct file upload activates once cloud storage is connected.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <p className="text-sm text-ink-soft">
                  No fixed character is required for this content - you are ready to go.
                </p>
                <Button variant="green" onClick={() => setStep(5)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* STEP 5 - Done */}
      {step === 5 && (
        <Card className="bg-paper-high border-line shadow-xs">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="display text-2xl font-semibold text-ink">
                Your channel is ready
              </h2>
              <p className="mt-2 text-sm text-ink-mute">
                {avatarSaved
                  ? "Visual identity saved. The agent will keep your character consistent."
                  : "The agent will research, script, produce, and schedule - you approve."}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="green" size="lg">
                Go to my dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
