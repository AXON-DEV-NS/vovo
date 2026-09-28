"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading-skeleton";
import {
  Laptop, Gamepad2, ChefHat, TrendingUp, GraduationCap, Film,
  Briefcase, Heart, Palette, Globe, Loader2, CheckCircle2, XCircle,
  Video, CreditCard, UserCircle2, Sparkles, PenLine, Target,
  ArrowRight, ArrowLeft, Upload, Link2, ShieldCheck,
} from "lucide-react";

/* ────────────────────────── types ────────────────────────── */

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface ChannelInfo {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  niche: string | null;
  markets: string[];
  requiresAvatar: boolean | null;
  referenceChannelUrl: string | null;
  referenceVideoUrl: string | null;
  hasAvatar: boolean;
}

interface PlanView {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features?: string[];
  popular?: boolean;
}

interface AccessStatus {
  hasAccess: boolean;
  planName?: string | null;
  message?: string;
}

interface RefResult {
  ok: boolean;
  channel: { ok: boolean; title?: string; error?: string };
  video: { ok: boolean; title?: string; error?: string };
}

/* ────────────────────────── constants ────────────────────────── */

const NICHE_OPTIONS = [
  { id: "technology", label: "Technology", icon: Laptop },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "cooking", label: "Cooking", icon: ChefHat },
  { id: "motivation", label: "Motivation", icon: TrendingUp },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "entertainment", label: "Entertainment", icon: Film },
  { id: "business", label: "Business & Finance", icon: Briefcase },
  { id: "health", label: "Health & Fitness", icon: Heart },
  { id: "creative", label: "Creative Arts", icon: Palette },
  { id: "other", label: "Other", icon: Globe },
];

/** Content types that need a consistent presenter/avatar across every video. */
const AVATAR_NICHES = new Set(["education", "health", "creative"]);

const STEP_TITLES: Record<Step, string> = {
  1: "Your account",
  2: "Subscription plan",
  3: "Connect YouTube",
  4: "Content type",
  5: "Reference channel & video",
  6: "Presenting avatar",
  7: "AI instructions",
  8: "Audience",
};

const YT_STATUS_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  connected: { text: "YouTube channel connected successfully.", ok: true },
  not_configured: { text: "YouTube connection is not configured yet. Please contact support.", ok: false },
  invalid_state: { text: "The connection request expired or was blocked. Please try again.", ok: false },
  db_not_configured: { text: "Database is not connected — the channel cannot be saved yet.", ok: false },
  no_channel: { text: "No YouTube channel was found on that Google account.", ok: false },
  failed: { text: "YouTube connection failed (expired token or missing permissions). Please try again.", ok: false },
};

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_FILE_BYTES = 5_000_000;
const MIN_AVATAR_PX = 256;
const AVATAR_OUTPUT_PX = 512;

/* ────────────────────────── page ────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<Step>(1);
  const [summary, setSummary] = useState(false);
  const [loading, setLoading] = useState(true);

  // account
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  // plan
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [refreshingAccess, setRefreshingAccess] = useState(false);

  // channel
  const [channel, setChannel] = useState<ChannelInfo | null>(null);

  // niche
  const [nicheChoice, setNicheChoice] = useState<string | null>(null);
  const [otherNiche, setOtherNiche] = useState("");
  const niche = nicheChoice === "other" ? otherNiche.trim() : nicheChoice ?? "";

  // references
  const [refChannel, setRefChannel] = useState("");
  const [refVideo, setRefVideo] = useState("");
  const [validating, setValidating] = useState(false);
  const [refResult, setRefResult] = useState<RefResult | null>(null);
  const [refErrors, setRefErrors] = useState<{ channel?: string; video?: string }>({});

  // avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // instructions
  const [instructions, setInstructions] = useState("");

  // audience
  const [audience, setAudience] = useState<"en" | "ar" | "both" | null>(null);

  const [stepError, setStepError] = useState("");
  const [saving, setSaving] = useState(false);

  const ytStatus = params.get("youtube");
  const statusMessage = ytStatus ? YT_STATUS_MESSAGES[ytStatus] : null;

  const requiresAvatar =
    Boolean(channel?.requiresAvatar) || (niche !== "" && AVATAR_NICHES.has(niche));

  /* ─────────── load state (resume) ─────────── */

  const loadState = useCallback(async () => {
    try {
      const [stateRes, plansRes, ytRes] = await Promise.all([
        fetch("/api/onboarding/state"),
        fetch("/api/plans"),
        fetch("/api/youtube/status"),
      ]);
      const state = await stateRes.json().catch(() => null);
      const plansData = await plansRes.json().catch(() => ({}));
      const ytData = await ytRes.json().catch(() => ({}));

      if (!stateRes.ok || !state?.ok) {
        if (state?.code === "DB_NOT_CONFIGURED") {
          setStepError("Database is not connected — onboarding state cannot be saved yet.");
        }
      } else {
        setAccountName(state.name ?? "");
        setAccountEmail(state.email ?? "");
        setInstructions(state.customInstructions ?? "");
        setAccess({ hasAccess: state.hasAccess, planName: state.planName, message: state.accessMessage });

        if (state.channel) {
          const ch = state.channel as ChannelInfo;
          setChannel(ch);
          if (ch.niche) {
            const known = NICHE_OPTIONS.some((n) => n.id === ch.niche);
            setNicheChoice(known ? ch.niche : "other");
            if (!known) setOtherNiche(ch.niche);
          }
          setRefChannel(ch.referenceChannelUrl ?? "");
          setRefVideo(ch.referenceVideoUrl ?? "");
          setAvatarSaved(Boolean(ch.hasAvatar));
          const m = ch.markets ?? [];
          setAudience(m.includes("ar") && m.includes("en") ? "both" : m.includes("ar") ? "ar" : m.includes("en") ? "en" : null);
        }

        if (state.completedAt) {
          setSummary(true);
          setStep(8);
        } else {
          setStep(Math.min(Math.max(state.step ?? 1, 1), 8) as Step);
        }
      }

      if (Array.isArray(plansData.plans)) setPlans(plansData.plans);
      if (ytRes.ok && Array.isArray(ytData.channels) && ytData.channels.length > 0 && !state?.channel) {
        setChannel(ytData.channels[0] as ChannelInfo);
      }
    } catch {
      setStepError("Could not load your setup progress. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  /* ─────────── helpers ─────────── */

  async function saveStep(next: Step) {
    setStep(next);
    setStepError("");
    try {
      await fetch("/api/onboarding/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: next }),
      });
    } catch {
      // progress saving is best-effort; the UI continues regardless
    }
  }

  async function refreshAccess() {
    setRefreshingAccess(true);
    try {
      const res = await fetch("/api/billing/status");
      const data = await res.json().catch(() => null);
      if (data) setAccess(data);
    } finally {
      setRefreshingAccess(false);
    }
  }

  /* ─────────── step handlers ─────────── */

  async function handleStepFour() {
    if (!niche) {
      setStepError("Choose a content type, or describe your own under “Other”.");
      return;
    }
    if (!channel) {
      setStepError("Connect your YouTube channel first.");
      return;
    }
    setSaving(true);
    setStepError("");
    try {
      const res = await fetch("/api/niche/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          channelId: channel.id,
          referenceVideoUrl: refVideo.trim() || undefined,
          referenceChannelUrl: refChannel.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStepError(data.error || "Could not save your content type. Please try again.");
        return;
      }
      await saveStep(5);
    } catch {
      setStepError("Could not save your content type. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidateReferences() {
    setRefErrors({});
    setRefResult(null);
    if (!refChannel.trim()) {
      setRefErrors((e) => ({ ...e, channel: "Enter the reference channel link." }));
      return;
    }
    if (!refVideo.trim()) {
      setRefErrors((e) => ({ ...e, video: "Enter the reference video link." }));
      return;
    }
    setValidating(true);
    try {
      const res = await fetch("/api/onboarding/validate-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: refChannel.trim(), videoUrl: refVideo.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as RefResult & { error?: string };
      if (res.status === 429) {
        setStepError(data.error || "Too many checks — wait a moment.");
        return;
      }
      if (!res.ok && data.error) {
        setStepError(data.error);
        return;
      }
      setRefResult({ ok: Boolean(data.ok), channel: data.channel, video: data.video });
      setRefErrors({
        channel: data.channel?.ok ? undefined : data.channel?.error,
        video: data.video?.ok ? undefined : data.video?.error,
      });
      if (data.ok) {
        // Persist the validated links on the channel.
        if (channel) {
          fetch("/api/onboarding/channel", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId: channel.id,
              referenceChannelUrl: refChannel.trim(),
              referenceVideoUrl: refVideo.trim(),
            }),
          }).catch(() => {});
        }
      }
    } catch {
      setStepError("Could not verify the links right now. Please try again.");
    } finally {
      setValidating(false);
    }
  }

  async function handleStepFive() {
    if (!refResult?.ok) {
      setStepError("Verify both links successfully before continuing.");
      return;
    }
    // Kick off the niche analysis in the BACKGROUND — never blocks the flow.
    if (niche) {
      fetch("/api/niche/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          referenceVideoUrl: refVideo.trim() || undefined,
          referenceChannelUrl: refChannel.trim() || undefined,
        }),
      }).catch(() => {});
    }
    await saveStep(6);
  }

  async function handleStepSeven() {
    setSaving(true);
    setStepError("");
    try {
      const res = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customInstructions: instructions }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStepError(data.error || "Could not save your instructions. Please try again.");
        return;
      }
      await saveStep(8);
    } catch {
      setStepError("Could not save your instructions. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStepEight() {
    if (!audience) {
      setStepError("Choose who your videos target.");
      return;
    }
    if (!channel) {
      setStepError("Connect your YouTube channel first.");
      return;
    }
    setSaving(true);
    setStepError("");
    try {
      const markets = audience === "both" ? ["en", "ar"] : [audience];
      const res = await fetch("/api/onboarding/channel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channel.id, markets }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStepError(data.error || "Could not save your audience. Please try again.");
        return;
      }
      await fetch("/api/onboarding/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 8 }),
      }).catch(() => {});
      setSummary(true);
    } catch {
      setStepError("Could not save your audience. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function activateAI() {
    setSaving(true);
    try {
      await fetch("/api/onboarding/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, step: 8 }),
      });
      router.push("/dashboard");
    } catch {
      setSaving(false);
      setStepError("Could not finish setup. Please try again.");
    }
  }

  /* ─────────── avatar pick + crop ─────────── */

  function pickAvatarFile(file: File) {
    setAvatarError("");
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Unsupported file type. Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setAvatarError("The photo is too large (max 5 MB).");
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < MIN_AVATAR_PX || img.height < MIN_AVATAR_PX) {
        setAvatarError(`The photo is too small (minimum ${MIN_AVATAR_PX}×${MIN_AVATAR_PX}px).`);
        return;
      }
      // Center-crop to a square and scale to 512×512.
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_OUTPUT_PX;
      canvas.height = AVATAR_OUTPUT_PX;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setAvatarError("Could not process the image on this device.");
        return;
      }
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        AVATAR_OUTPUT_PX,
        AVATAR_OUTPUT_PX
      );
      setAvatarPreview(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => setAvatarError("Could not read the image file.");
    img.src = objectUrl;
  }

  async function uploadAvatar() {
    if (!avatarPreview || !channel) return;
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const res = await fetch(`/api/channels/${channel.id}/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: avatarPreview, mime: "image/jpeg" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setAvatarSaved(true);
      } else {
        setAvatarError(data.error || "Could not upload the photo. Please try again.");
      }
    } catch {
      setAvatarError("Could not upload the photo. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  }

  /* ─────────── render ─────────── */

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-6" aria-hidden="true">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="rounded-2xl border border-line bg-paper-high p-6 shadow-soft space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </div>
    );
  }

  const stepNumber = summary ? 8 : step;
  const canGoBack = !summary && step > 1;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <div>
        <span className="eyebrow">Guided setup</span>
        <h1 className="display mt-3 text-3xl font-semibold text-ink">
          {summary ? "You're all set" : "Set up your AI-managed channel"}
        </h1>
        <p className="mt-2 text-sm text-ink-mute">
          {summary
            ? "Review everything below — edit anything before activating the AI."
            : `Step ${stepNumber} of 8 — ${STEP_TITLES[stepNumber as Step]}. Your progress is saved automatically.`}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2" aria-hidden="true">
        {([1, 2, 3, 4, 5, 6, 7, 8] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              stepNumber >= s ? "bg-ink" : "bg-line"
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

      {stepError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {stepError}
        </div>
      )}

      {summary ? (
        <SummaryView
          access={access}
          channel={channel}
          niche={niche}
          refChannel={refChannel}
          refVideo={refVideo}
          avatarSaved={avatarSaved}
          instructions={instructions}
          audience={audience}
          requiresAvatar={requiresAvatar}
          saving={saving}
          onEdit={(n) => {
            setSummary(false);
            setStep(n);
          }}
          onActivate={activateAI}
        />
      ) : (
        <>
          {/* STEP 1 — Account */}
          {step === 1 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle2 className="h-5 w-5 text-green-600" />
                  Your account is ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-line bg-paper p-4 text-sm">
                  <p className="font-medium text-ink">{accountName || accountEmail.split("@")[0]}</p>
                  <p className="mt-0.5 text-ink-mute">{accountEmail}</p>
                </div>
                <p className="text-sm text-ink-mute">
                  Next: choose a subscription plan so the AI agent can start working for you.
                </p>
                <div className="flex justify-end">
                  <Button variant="primary" onClick={() => saveStep(2)}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2 — Plan */}
          {step === 2 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-gold-600" />
                  Choose your subscription plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {access?.hasAccess ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-800">
                          Payment complete{access.planName ? ` — ${access.planName}` : ""}
                        </p>
                        <p className="text-xs text-emerald-700">{access.message}</p>
                      </div>
                    </div>
                    <Button variant="green" onClick={() => saveStep(3)}>
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
                        const active = selectedPlan === plan.id;
                        return (
                          <button
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                              active
                                ? "border-green-500 ring-2 ring-green-500/20 bg-green-50/40"
                                : plan.popular
                                  ? "border-gold-300 bg-gold-50/40 hover:border-gold-400"
                                  : "border-line bg-paper hover:border-ink-faint"
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
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
                              {(plan.features ?? []).slice(0, 3).map((f, i) => (
                                <li key={i}>- {f}</li>
                              ))}
                            </ul>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Link
                        href={`/checkout?plan=${selectedPlan ?? "starter"}&billing=${billing}`}
                        className="order-2 sm:order-1"
                        aria-disabled={!selectedPlan}
                      >
                        <Button variant="primary" disabled={!selectedPlan} className="w-full sm:w-auto">
                          Continue to payment <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <button
                        onClick={refreshAccess}
                        disabled={refreshingAccess}
                        className="order-1 inline-flex items-center gap-1.5 text-xs font-medium text-ink-mute underline-offset-4 hover:text-ink hover:underline sm:order-2"
                      >
                        {refreshingAccess && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Already paid? Refresh status
                      </button>
                    </div>
                    <p className="text-xs text-ink-faint">
                      Your payment is handled on the secure checkout page. If a payment fails, you can retry
                      there with a different card — your setup progress is kept.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 3 — YouTube */}
          {step === 3 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="h-5 w-5 text-green-600" />
                  Connect your YouTube channel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {channel ? (
                  <>
                    <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      {channel.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={channel.thumbnailUrl}
                          alt={channel.title}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                          {channel.title.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-emerald-900">{channel.title}</p>
                        <p className="text-xs text-emerald-700">
                          {channel.subscriberCount.toLocaleString("en-US")} subscribers •{" "}
                          {channel.videoCount} videos — connected
                        </p>
                      </div>
                      <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-600" />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="green" onClick={() => saveStep(4)}>
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-ink-mute">
                      We request only the permissions needed to publish and analyze — you can revoke access
                      anytime from your Google account.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        variant="primary"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          window.location.href = "/api/youtube/connect";
                        }}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Connect with Google
                      </Button>
                      {ytStatus && !statusMessage?.ok && (
                        <p className="text-xs text-amber-700">
                          Something went wrong — press “Connect with Google” to try again.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 4 — Niche */}
          {step === 4 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  What type of content do you make?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {NICHE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = nicheChoice === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setNicheChoice(option.id)}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm font-medium transition-all ${
                          active
                            ? "border-green-500 ring-2 ring-green-500/20 bg-green-50/50 text-ink"
                            : "border-line bg-paper text-ink-soft hover:border-ink-faint"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-green-700" />
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                {nicheChoice === "other" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                      Describe your content type
                    </label>
                    <input
                      value={otherNiche}
                      onChange={(e) => setOtherNiche(e.target.value)}
                      placeholder="e.g. Home Automation & Smart Tech"
                      className="flex h-10 w-full rounded-md border border-line bg-paper-high px-4 text-sm text-ink placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                    <p className="mt-1 text-xs text-ink-faint">
                      Keep it short — the AI expands it into a full strategy later.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {canGoBack ? (
                    <button
                      onClick={() => setStep((step - 1) as Step)}
                      className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <Button variant="primary" onClick={handleStepFour} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5 — References */}
          {step === 5 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Link2 className="h-5 w-5 text-green-600" />
                  Reference channel & example video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-ink-mute">
                  Give the AI one channel and one video that represent the content you want. Both links are
                  checked against YouTube before you continue.
                </p>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Reference channel link
                  </label>
                  <input
                    value={refChannel}
                    onChange={(e) => {
                      setRefChannel(e.target.value);
                      setRefResult(null);
                    }}
                    placeholder="https://www.youtube.com/@channelname"
                    className={`flex h-10 w-full rounded-md border bg-paper-high px-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 ${
                      refErrors.channel
                        ? "border-red-400 focus:ring-red-500/20"
                        : "border-line focus:border-green-500 focus:ring-green-500/20"
                    }`}
                  />
                  {refErrors.channel ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3.5 w-3.5" /> {refErrors.channel}
                    </p>
                  ) : refResult?.channel?.ok ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {refResult.channel.title ? `Found: ${refResult.channel.title}` : "Channel verified."}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Example video link
                  </label>
                  <input
                    value={refVideo}
                    onChange={(e) => {
                      setRefVideo(e.target.value);
                      setRefResult(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`flex h-10 w-full rounded-md border bg-paper-high px-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 ${
                      refErrors.video
                        ? "border-red-400 focus:ring-red-500/20"
                        : "border-line focus:border-green-500 focus:ring-green-500/20"
                    }`}
                  />
                  {refErrors.video ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3.5 w-3.5" /> {refErrors.video}
                    </p>
                  ) : refResult?.video?.ok ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {refResult.video.title ? `Found: ${refResult.video.title}` : "Video verified."}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(4)}
                    className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleValidateReferences} disabled={validating}>
                      {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Verify links
                    </Button>
                    <Button variant="primary" onClick={handleStepFive} disabled={!refResult?.ok}>
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 6 — Avatar */}
          {step === 6 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle2 className="h-5 w-5 text-gold-600" />
                  Presenting avatar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {requiresAvatar ? (
                  <>
                    <p className="text-sm text-ink-mute">
                      Your content type uses a presenter. Upload one clear photo — it becomes the same
                      avatar in every future video, never regenerated or randomized.
                    </p>

                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                      {avatarPreview || avatarSaved ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview ?? `/api/channels/${channel?.id}/avatar`}
                          alt="Avatar preview"
                          className="h-24 w-24 rounded-2xl border border-line object-cover shadow-soft"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-paper text-ink-faint">
                          <UserCircle2 className="h-8 w-8" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) pickAvatarFile(file);
                          }}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4" />
                            {avatarPreview ? "Choose another" : "Choose a photo"}
                          </Button>
                          {avatarPreview && !avatarSaved && (
                            <Button variant="primary" onClick={uploadAvatar} disabled={avatarUploading}>
                              {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Save avatar
                            </Button>
                          )}
                          {avatarSaved && (
                            <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" /> Avatar saved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-faint">
                          JPEG, PNG or WebP · up to 5 MB · at least {MIN_AVATAR_PX}×{MIN_AVATAR_PX}px.
                          It will be cropped to a centered square.
                        </p>
                        {avatarError && (
                          <p className="flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="h-3.5 w-3.5" /> {avatarError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => setStep(5)}
                        className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <Button variant="primary" onClick={() => saveStep(7)} disabled={!avatarSaved}>
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4">
                      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <p className="text-sm text-ink-soft">
                        Your content type doesn’t need a fixed presenter — no avatar required. You can
                        still add one later from your channel settings if your format changes.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => setStep(5)}
                        className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <Button variant="primary" onClick={() => saveStep(7)}>
                        Skip & continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 7 — AI instructions */}
          {step === 7 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PenLine className="h-5 w-5 text-green-600" />
                  AI custom instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-ink-mute">
                  Style notes, tone, pacing, always-include or always-avoid rules. The AI applies these to
                  every script — and you can edit them anytime in Settings.
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Instructions (optional)
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value.slice(0, 2000))}
                    rows={6}
                    placeholder={
                      "Examples:\n- Always open with a bold question in the first 3 seconds\n- Keep a calm, confident tone — no hype\n- Never use clickbait titles\n- Mention the product name once, mid-video"
                    }
                    className="flex w-full rounded-md border border-line bg-paper-high px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                  <p className="mt-1 text-right text-xs text-ink-faint">{instructions.length}/2000</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(6)}
                    className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <Button variant="primary" onClick={handleStepSeven} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 8 — Audience */}
          {step === 8 && (
            <Card className="bg-paper-high border-line shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-green-600" />
                  Who is your audience?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-ink-mute">
                  This decides the default language, voice, subtitles, and the best publishing times for
                  your videos.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      { id: "ar", label: "Arabic-speaking", hint: "Arabic voice & subtitles" },
                      { id: "en", label: "International", hint: "English voice & subtitles" },
                      { id: "both", label: "Both", hint: "Per-video language choice" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setAudience(option.id)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        audience === option.id
                          ? "border-green-500 ring-2 ring-green-500/20 bg-green-50/50"
                          : "border-line bg-paper hover:border-ink-faint"
                      }`}
                    >
                      <p className="font-semibold text-ink">{option.label}</p>
                      <p className="mt-1 text-xs text-ink-mute">{option.hint}</p>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(7)}
                    className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <Button variant="primary" onClick={handleStepEight} disabled={saving || !audience}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Review setup <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────── summary view ────────────────────────── */

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="mt-0.5 truncate text-sm text-ink">{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="shrink-0 text-xs font-medium text-green-700 underline-offset-4 hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

function SummaryView({
  access,
  channel,
  niche,
  refChannel,
  refVideo,
  avatarSaved,
  instructions,
  audience,
  requiresAvatar,
  saving,
  onEdit,
  onActivate,
}: {
  access: AccessStatus | null;
  channel: ChannelInfo | null;
  niche: string;
  refChannel: string;
  refVideo: string;
  avatarSaved: boolean;
  instructions: string;
  audience: "en" | "ar" | "both" | null;
  requiresAvatar: boolean;
  saving: boolean;
  onEdit: (n: Step) => void;
  onActivate: () => void;
}) {
  const audienceLabel =
    audience === "ar" ? "Arabic-speaking" : audience === "both" ? "Both markets" : "International";

  return (
    <Card className="bg-paper-high border-line shadow-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Setup complete — review before activating
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <SummaryRow
          label="Subscription"
          value={access?.hasAccess ? access.planName ?? "Active plan" : "No active subscription"}
          onEdit={() => onEdit(2)}
        />
        <SummaryRow label="YouTube channel" value={channel?.title ?? "Not connected"} onEdit={() => onEdit(3)} />
        <SummaryRow label="Content type" value={niche || "Not set"} onEdit={() => onEdit(4)} />
        <SummaryRow
          label="Reference channel"
          value={refChannel || "Not set"}
          onEdit={() => onEdit(5)}
        />
        <SummaryRow label="Reference video" value={refVideo || "Not set"} onEdit={() => onEdit(5)} />
        <SummaryRow
          label="Presenter avatar"
          value={requiresAvatar ? (avatarSaved ? "Uploaded — reused in every video" : "Required — not uploaded") : "Not needed"}
          onEdit={() => onEdit(6)}
        />
        <SummaryRow
          label="AI instructions"
          value={instructions ? `${instructions.slice(0, 80)}${instructions.length > 80 ? "…" : ""}` : "None yet"}
          onEdit={() => onEdit(7)}
        />
        <SummaryRow label="Audience" value={audienceLabel} onEdit={() => onEdit(8)} />

        <div className="pt-5">
          <Button
            variant="green"
            size="lg"
            className="w-full"
            onClick={onActivate}
            disabled={saving || !access?.hasAccess || !channel || (requiresAvatar && !avatarSaved)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Activate the AI agent
          </Button>
          {(!access?.hasAccess || !channel || (requiresAvatar && !avatarSaved)) && (
            <p className="mt-2 text-center text-xs text-amber-700">
              Finish the required steps above (and connect a paid plan) to activate the agent.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
