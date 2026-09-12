"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Eye,
  DollarSign,
  Video,
  Plus,
  BarChart3,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface ChannelInfo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  niche: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
}

interface AccountInfo {
  name: string | null;
  email: string;
}

interface AccessStatus {
  hasAccess: boolean;
  planName?: string | null;
  status: string;
}

/**
 * Dashboard — 100% real data only.
 * A fresh account starts with clean empty states until a channel is connected
 * and content is actually produced. No mock values are ever rendered.
 */
export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [access, setAccess] = useState<AccessStatus | null>(null);

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([
        fetch("/api/settings/account").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/youtube/status").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/content").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/billing/status").then((r) => (r.ok ? r.json() : null)),
      ]);

      const [accountRes, channelsRes, contentRes, accessRes] = results;
      if (accountRes.status === "fulfilled" && accountRes.value) setAccount(accountRes.value);
      if (channelsRes.status === "fulfilled" && channelsRes.value?.channels) {
        setChannels(channelsRes.value.channels);
      }
      if (contentRes.status === "fulfilled" && Array.isArray(contentRes.value)) {
        setContent(contentRes.value);
      }
      if (accessRes.status === "fulfilled" && accessRes.value) setAccess(accessRes.value);

      setLoading(false);
    }
    load();
  }, []);

  const hasChannels = channels.length > 0;
  const totalSubscribers = channels.reduce((sum, c) => sum + (c.subscriberCount || 0), 0);
  const published = content.filter((c) => c.status === "PUBLISHED").length;
  const pendingReview = content.filter((c) => c.status === "READY_FOR_REVIEW").length;

  const stats = [
    {
      label: "Subscribers",
      value: hasChannels ? totalSubscribers.toLocaleString() : "—",
      hint: hasChannels ? "Across connected channels" : "Connect a channel",
      icon: Users,
    },
    {
      label: "Views (30d)",
      value: "—",
      hint: "Available after analytics sync",
      icon: Eye,
    },
    {
      label: "Est. Revenue",
      value: "—",
      hint: "Available after analytics sync",
      icon: DollarSign,
    },
    {
      label: "Published",
      value: String(published),
      hint: pendingReview > 0 ? `${pendingReview} awaiting review` : "Real published count",
      icon: Video,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          {t("welcome", { name: account?.name || account?.email?.split("@")[0] || "Creator" })}
        </h1>
        <p className="text-ink-mute">
          {hasChannels
            ? "Here is what is happening with your channels."
            : "Connect your YouTube channel to get started — your dashboard fills with real data only."}
        </p>
      </div>

      {!access?.hasAccess && (
        <div className="flex flex-col gap-3 rounded-xl border border-gold-200 bg-gold-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gold-800">
            No active subscription yet — choose a plan to activate the AI agent.
          </p>
          <Link href="/onboarding">
            <Button variant="gold" size="sm">
              Choose a plan
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid — real values only (— until data exists) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-mute">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-ink-faint" />
              </div>
              <p className="text-2xl font-bold text-ink">{stat.value}</p>
              <p className="mt-1 text-xs text-ink-faint">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Channels — real list with clean empty state */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t("channels.title")}</CardTitle>
                <Link href="/channels/connect">
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                    {t("channels.connectNew")}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {hasChannels ? (
                <div className="space-y-3">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between rounded-xl border border-paper-low p-3"
                    >
                      <div className="flex items-center gap-3">
                        {channel.thumbnailUrl ? (
                          <img
                            src={channel.thumbnailUrl}
                            alt={channel.title}
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-sm font-bold text-green-700">
                            {channel.title.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-ink">{channel.title}</p>
                          <p className="text-xs text-ink-faint">
                            {channel.subscriberCount.toLocaleString()} subscribers
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Connected</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-low text-ink-faint">
                    <Video className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-ink-mute">No channels connected yet.</p>
                  <Link href="/channels/connect">
                    <Button variant="green" size="sm">
                      <Plus className="h-4 w-4" />
                      Connect YouTube
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity — real content pipeline state */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("alerts.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {content.length > 0 ? (
                <div className="space-y-3">
                  {content.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-paper-low p-3"
                    >
                      <div className="mt-0.5 rounded-lg bg-green-50 p-1.5 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink-soft">{item.title}</p>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {item.status.replaceAll("_", " ")}
                          {item.scheduledAt
                            ? ` — scheduled ${new Date(item.scheduledAt).toLocaleDateString()}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-low text-ink-faint">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-ink-mute">
                    {hasChannels
                      ? "No content yet — the agent will fill this once production starts."
                      : "No activity yet. Connect a channel to begin."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/channels/connect">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            {t("addChannel")}
          </Button>
        </Link>
        <Link href="/analytics">
          <Button variant="secondary">
            <BarChart3 className="h-4 w-4" />
            {t("viewAnalytics")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
