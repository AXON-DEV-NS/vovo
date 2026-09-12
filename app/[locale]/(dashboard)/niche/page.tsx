"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  Laptop, Gamepad2, ChefHat, TrendingUp, GraduationCap, Film,
  Briefcase, Heart, Palette, Globe, Loader2, CheckCircle, Video, Link2,
  Lock, Sparkles, Zap, ArrowRight, ShieldCheck,
} from "lucide-react";

const nicheCategories = [
  { id: "tech", icon: Laptop, label: "Technology" },
  { id: "gaming", icon: Gamepad2, label: "Gaming" },
  { id: "cooking", icon: ChefHat, label: "Cooking" },
  { id: "motivation", icon: TrendingUp, label: "Motivation" },
  { id: "business", icon: Briefcase, label: "Business & Finance" },
  { id: "education", icon: GraduationCap, label: "Education" },
  { id: "entertainment", icon: Film, label: "Entertainment" },
  { id: "health", icon: Heart, label: "Health & Fitness" },
  { id: "creative", icon: Palette, label: "Creative Arts" },
];

const toneOptions = [
  { id: "formal", name: "Formal", desc: "Professional, authoritative, well-structured" },
  { id: "energetic", name: "Energetic", desc: "Dynamic, exciting, high-energy delivery" },
  { id: "calm", name: "Calm", desc: "Relaxed, thoughtful, easy-going pace" },
  { id: "humorous", name: "Humorous", desc: "Witty, entertaining, light-hearted" },
];

interface AccessStatus {
  hasAccess: boolean;
  status: "ACTIVE" | "TRIALING" | "EVENT" | "LOCKED";
  reason: string;
  planName: string | null;
  daysRemaining?: number;
  message: string;
}

export default function NichePage() {
  const t = useTranslations("niche");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [idea, setIdea] = useState("");
  const [market, setMarket] = useState<"us" | "arabic" | "both">("us");
  const [tone, setTone] = useState<string>("formal");
  const [referenceVideoUrl, setReferenceVideoUrl] = useState("");
  const [referenceChannelUrl, setReferenceChannelUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => setAccess(d))
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);

    // Sync with the niche knowledge base: links this channel's niche to the
    // shared record, saves reference video & competitor channel for AI analysis.
    try {
      await fetch("/api/niche/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: selectedNiche ?? "general",
          description: idea || undefined,
          tone,
          markets: [market],
          referenceVideoUrl: referenceVideoUrl.trim() || undefined,
          referenceChannelUrl: referenceChannelUrl.trim() || undefined,
        }),
      });
    } catch {
      // Knowledge-base sync is best-effort — never block saving the strategy.
    }

    let latestAccess = access;
    try {
      const accessRes = await fetch("/api/billing/status").then((r) => r.json()).catch(() => null);
      if (accessRes) {
        setAccess(accessRes);
        latestAccess = accessRes;
      }
    } catch {}

    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);

    // If client does NOT have active access, prompt them to subscribe
    if (latestAccess && !latestAccess.hasAccess) {
      setShowPlanModal(true);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="text-ink-mute">{t("subtitle")}</p>
      </div>

      {/* Access status alert / banner */}
      {access && (
        <>
          {access.status === "LOCKED" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    وكيل الذكاء الاصطناعي متوقف — بانتظار تفعيل الاشتراك لبدء الإنتاج
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    يمكنك إكمال إعداد الاستراتيجية وحفظها الآن، وسيبدأ الوكيل تلقائياً في إنتاج السكربتات وجدولة الفيديوهات فور تفعيل اشتراكك.
                  </p>
                </div>
              </div>
              <Link href="/pricing" className="shrink-0 w-full sm:w-auto">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  اختيار خطة
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {access.status === "EVENT" && (
            <div className="rounded-2xl border border-green-200 bg-green-50/80 p-4 flex items-center gap-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900">
                  🎉 فعالية وصول مجاني نشطة!
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  الوكيل الذكي يعمل بكامل طاقته ومتاح لك مجاناً خلال فترة الحدث الترويجي (متبقي {access.daysRemaining} يوم). سيبدأ العمل فور حفظ الاستراتيجية.
                </p>
              </div>
            </div>
          )}

          {access.status === "TRIALING" && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 flex items-center gap-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  ⚡ الفترة التجريبية نشطة (متبقي {access.daysRemaining} يوم)
                </p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  وكيلك الذكي سيبدأ العمل وتحليل المنافسين وإنتاج المحتوى فور الحفظ مجاناً طوال فترة التجربة.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Niche Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t("selectNiche")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {nicheCategories.map((niche) => (
              <button
                key={niche.id}
                onClick={() => setSelectedNiche(niche.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center",
                  selectedNiche === niche.id ? "border-green-500 bg-green-50 shadow-card" : "border-line hover:border-line-strong hover:bg-paper"
                )}
              >
                <niche.icon className={cn("h-6 w-6", selectedNiche === niche.id ? "text-green-600" : "text-ink-faint")} />
                <span className={cn("text-sm font-medium", selectedNiche === niche.id ? "text-green-700" : "text-ink-soft")}>{niche.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Idea Description */}
      <Card>
        <CardHeader>
          <CardTitle>{t("describeIdea")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={t("describePlaceholder")}
            rows={4}
            className="flex w-full rounded-xl border border-line bg-paper-high px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors"
          />
          <div className="mt-2 rounded-xl bg-paper border border-paper-low p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="green">{t("aiSuggestion")}</Badge>
            </div>
            <p className="text-xs text-ink-faint">{t("placeholder")}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Inspiration & Competitor Study */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            <span>{t("referencesTitle")}</span>
          </CardTitle>
          <CardDescription>
            {t("referencesSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">
              {t("referenceVideoLabel")}
            </label>
            <input
              type="url"
              value={referenceVideoUrl}
              onChange={(e) => setReferenceVideoUrl(e.target.value)}
              placeholder={t("referenceVideoPlaceholder")}
              className="flex w-full rounded-xl border border-line bg-paper-high px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors font-mono"
              dir="ltr"
            />
            <p className="mt-1 text-[11px] text-ink-faint">
              💡 سيقوم الذكاء الاصطناعي بتحليل سرعة الإلقاء (Pacing)، بنية السكربت، وطريقة شد انتباه المشاهد في هذا الفيديو لإنتاج محتوى مماثل.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">
              {t("referenceChannelLabel")}
            </label>
            <input
              type="url"
              value={referenceChannelUrl}
              onChange={(e) => setReferenceChannelUrl(e.target.value)}
              placeholder={t("referenceChannelPlaceholder")}
              className="flex w-full rounded-xl border border-line bg-paper-high px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors font-mono"
              dir="ltr"
            />
            <p className="mt-1 text-[11px] text-ink-faint">
              💡 سيقوم الذكاء الاصطناعي برصد وتحليل استراتيجية هذه القناة والمواضيع الأكثر انتشاراً بها لتوليد أفكار تنافسية حصرية لقناتك.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Target Market */}
      <Card>
        <CardHeader>
          <CardTitle>{t("targetMarket")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(["us", "arabic", "both"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMarket(m)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                  market === m ? "border-green-500 bg-green-50" : "border-line hover:border-line-strong"
                )}
              >
                <Globe className={cn("h-5 w-5", market === m ? "text-green-600" : "text-ink-faint")} />
                <span className={cn("text-sm font-medium", market === m ? "text-green-700" : "text-ink-soft")}>{t(`marketOptions.${m}`)}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tone */}
      <Card>
        <CardHeader>
          <CardTitle>{t("toneAndVoice")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {toneOptions.map((tItem) => (
              <button
                key={tItem.id}
                onClick={() => setTone(tItem.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  tone === tItem.id ? "border-green-500 bg-green-50" : "border-line hover:border-line-strong"
                )}
              >
                <p className={cn("text-sm font-medium mb-1", tone === tItem.id ? "text-green-700" : "text-ink")}>{tItem.name}</p>
                <p className="text-xs text-ink-mute">{tItem.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{t("success")}</span>
          </div>
        )}
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
