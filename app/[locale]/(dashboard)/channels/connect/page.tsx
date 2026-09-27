"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Check, ArrowLeft, ArrowRight, Video as Youtube, Shield, Loader2, CheckCircle } from "lucide-react";

const steps = [
  { key: "step1", icon: Youtube },
  { key: "step2", icon: Shield },
  { key: "step3", icon: Loader2 },
];

const mockChannels = [
  { id: "1", title: "My Tech Channel", thumbnail: "", subscribers: "124,500", videoCount: 342 },
  { id: "2", title: "Gaming Highlights", thumbnail: "", subscribers: "32,100", videoCount: 89 },
];

export default function ChannelConnectPage() {
  const t = useTranslations("channels.connect");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  function handleConnect() {
    setCurrentStep(1);
  }

  function handleApprove() {
    setCurrentStep(2);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setScanProgress(Math.min(progress, 100));
    }, 500);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
              i <= currentStep ? "bg-green-600 text-paper-high" : "bg-paper-low text-ink-faint"
            )}>
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px w-12 sm:w-20", i < currentStep ? "bg-green-600" : "bg-line")} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Choose channel */}
      {currentStep === 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-ink mb-2">{t("step1.title")}</h2>
            <p className="text-sm text-ink-mute mb-6">{t("step1.desc")}</p>
            <div className="space-y-3">
              {mockChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                    selectedChannel === ch.id ? "border-green-500 bg-green-50 shadow-card" : "border-line hover:border-line-strong"
                  )}
                >
                  <div className="h-12 w-12 rounded-xl bg-paper-low flex items-center justify-center">
                    <Youtube className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ink">{ch.title}</p>
                    <p className="text-sm text-ink-faint">{ch.subscribers} subscribers · {ch.videoCount} videos</p>
                  </div>
                  {selectedChannel === ch.id && <CheckCircle className="h-5 w-5 text-green-600" />}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleConnect} disabled={!selectedChannel}>
                {t("connectButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Review permissions */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-ink mb-2">{t("step2.title")}</h2>
            <p className="text-sm text-ink-mute mb-6">{t("step2.desc")}</p>
            <div className="space-y-3 mb-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-paper p-4">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-ink-soft">{t(`step2.scopes.${i}`)}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
              <p className="text-sm text-green-700 font-medium">{t("step2.note")}</p>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(0)}>
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Button>
              <Button onClick={handleApprove}>
                {t("continue")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Scanning */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-6">
              <div className="relative h-24 w-24 mx-auto">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#E4E4E7" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none" stroke="#4F46E5" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - scanProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-ink">{Math.round(scanProgress)}%</span>
                </div>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-ink mb-2">{t("step3.title")}</h2>
            <p className="text-sm text-ink-mute mb-8">{t("step3.desc")}</p>
            <div className="max-w-sm mx-auto space-y-3">
              {["scanning", "analyzing", "optimizing"].map((phase, i) => {
                const phaseProgress = Math.max(0, Math.min(100, (scanProgress - i * 33) * 3));
                const isDone = scanProgress >= (i + 1) * 33;
                return (
                  <div key={phase} className="flex items-center gap-3">
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", isDone ? "bg-green-100 text-green-700" : "bg-paper-low text-ink-faint")}>
                      {isDone ? <Check className="h-3 w-3" /> : <div className="h-2 w-2 rounded-full bg-line-strong animate-pulse" />}
                    </div>
                    <p className={cn("text-sm", isDone ? "text-ink" : "text-ink-faint")}>{t(`step3.${phase}`)}</p>
                  </div>
                );
              })}
            </div>
            {scanProgress >= 100 && (
              <div className="mt-8">
                <Badge variant="success" className="text-sm px-4 py-1">Channel connected successfully!</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
