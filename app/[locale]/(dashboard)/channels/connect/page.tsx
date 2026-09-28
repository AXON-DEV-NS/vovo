"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { Video as Youtube, Shield, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const YT_STATUS_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  connected: { text: "YouTube channel connected successfully.", ok: true },
  not_configured: { text: "YouTube connection is not configured yet. Please contact support.", ok: false },
  invalid_state: { text: "The connection request expired or was blocked. Please try again.", ok: false },
  db_not_configured: { text: "Database is not connected — the channel cannot be saved yet.", ok: false },
  no_channel: { text: "No YouTube channel was found on that Google account.", ok: false },
  failed: { text: "YouTube connection failed (expired token or missing permissions). Please try again.", ok: false },
};

interface ChannelRow {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
}

/**
 * Real channel connection page — no simulated steps.
 * Starting the flow redirects to Google OAuth; the server callback stores the
 * channel; this page simply reflects the real connection state.
 */
export default function ChannelConnectPage() {
  const t = useTranslations("channels.connect");
  const router = useRouter();
  const params = useSearchParams();
  const ytStatus = params.get("youtube");
  const statusMessage = ytStatus ? YT_STATUS_MESSAGES[ytStatus] : null;

  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch("/api/youtube/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.channels)) setChannels(d.channels as ChannelRow[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startConnect() {
    setConnecting(true);
    window.location.href = "/api/youtube/connect";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="mt-2 text-sm text-ink-mute">
          We request only the permissions needed to publish and analyze — revoke access anytime from your
          Google account.
        </p>
      </div>

      {statusMessage && (
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
            statusMessage.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          )}
        >
          {statusMessage.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="space-y-4 p-6" aria-hidden="true">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Real connected channels */}
          {channels.length > 0 && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold text-ink">Connected channels</h2>
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-4 rounded-xl border border-line p-4"
                  >
                    {ch.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ch.thumbnailUrl}
                        alt={ch.title}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                        <Youtube className="h-6 w-6 text-green-700" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{ch.title}</p>
                      <p className="text-sm text-ink-faint">
                        {ch.subscriberCount.toLocaleString("en-US")} subscribers ·{" "}
                        {ch.videoCount.toLocaleString("en-US")} videos
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={startConnect} disabled={connecting}>
                    {connecting ? "Redirecting…" : "Connect another channel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connect card / empty state */}
          <Card>
            <CardContent className="space-y-6 p-6">
              {channels.length === 0 ? (
                <EmptyState
                  icon={<Youtube className="h-8 w-8 text-ink-faint" />}
                  title="No channel connected yet"
                  description="Connect your YouTube channel to let the AI agent research, produce, and publish on your behalf."
                  action={{ label: "Connect with Google", onClick: startConnect }}
                />
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-ink">Permissions we request</h2>
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-paper p-4">
                        <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-ink-soft">{t(`step2.scopes.${i}`)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                    <p className="text-sm text-green-700 font-medium">{t("step2.note")}</p>
                  </div>
                </>
              )}

              {channels.length === 0 && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-paper p-4">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-ink-soft">{t(`step2.scopes.${i}`)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              Back to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
