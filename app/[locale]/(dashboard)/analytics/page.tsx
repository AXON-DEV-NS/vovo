"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton, StatCardSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, TrendingUp, DollarSign, Clock, BarChart3, Video } from "lucide-react";
import Image from "next/image";
import type { ChannelAnalytics, DateRangePreset } from "@/lib/analytics/data-layer";

const PRESETS: DateRangePreset[] = ["7d", "30d", "90d"];

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-line bg-paper px-6 text-center text-sm text-ink-mute">
      {text}
    </div>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const router = useRouter();
  const [channels, setChannels] = useState<{ id: string; title: string }[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [data, setData] = useState<ChannelAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real connected channels only — no placeholders.
  useEffect(() => {
    let mounted = true;
    fetch("/api/youtube/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!mounted) return;
        const list: { id: string; title: string }[] = Array.isArray(d?.channels)
          ? d.channels.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
          : [];
        setChannels(list);
        setChannelId(list[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setChannelsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!channelId) {
      setData(null);
      return;
    }
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/analytics?channelId=${channelId}&preset=${preset}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setData(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [channelId, preset]);

  const hasTrends = Boolean(data?.trendsAvailable && data.views.length > 0);
  const totalViews = data?.views.reduce((acc, curr) => acc + curr.value, 0) ?? 0;
  const latestSubscribers = data?.subscriberGrowth.length
    ? data.subscriberGrowth[data.subscriberGrowth.length - 1].value
    : 0;
  const totalWatchTime = (data?.watchTimeMinutes.reduce((acc, curr) => acc + curr.value, 0) ?? 0) / 60;
  const totalRevenue = data?.estimatedRevenue.reduce((acc, curr) => acc + curr.value, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
          <p className="text-ink-mute">{t("description")}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {channels.length > 0 && (
            <div className="flex flex-wrap bg-paper-low rounded-xl p-1">
              {channels.map((ch) => (
                <Button
                  key={ch.id}
                  variant={channelId === ch.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setChannelId(ch.id)}
                  className="rounded-lg shadow-none max-w-[12rem] truncate"
                >
                  {ch.title}
                </Button>
              ))}
            </div>
          )}

          <div className="flex bg-paper-low rounded-xl p-1">
            {PRESETS.map((p) => (
              <Button
                key={p}
                variant={preset === p ? "primary" : "ghost"}
                size="sm"
                onClick={() => setPreset(p)}
                className="rounded-lg shadow-none"
              >
                {t(`filters.${p}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {channelsLoading || (channelId && isLoading) ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : channels.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8 text-ink-faint" />}
          title="No channel connected yet"
          description="Connect your YouTube channel to see real analytics here — nothing is simulated."
          action={{
            label: "Connect a channel",
            onClick: () => router.push("/channels/connect"),
          }}
        />
      ) : !data ? (
        <EmptyState 
          icon={<BarChart3 className="h-8 w-8 text-ink-faint" />}
          title={t("emptyState.title")}
          description={t("emptyState.description")}
        />
      ) : (
        <>
          {!data.trendsAvailable && data.message && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {data.message}
            </div>
          )}

          {/* Stats Grid — real values only; “—” until the metric genuinely exists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.totalViews")}</p>
                  <Eye className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>
                  {hasTrends ? totalViews.toLocaleString("en-US") : "—"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.subscriberGrowth")}</p>
                  <TrendingUp className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>
                  {(hasTrends ? latestSubscribers : data.subscriberCount).toLocaleString("en-US")}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.watchTime")}</p>
                  <Clock className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>
                  {hasTrends ? `${totalWatchTime.toLocaleString("en-US", { maximumFractionDigits: 1 })} h` : "—"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.estRevenue")}</p>
                  <DollarSign className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>
                  {data.estimatedRevenue.length ? `$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
                </p>
                {!data.estimatedRevenue.length && (
                  <p className="mt-1 text-xs text-ink-faint">Requires YouTube revenue access</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.viewsOverTime")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.views.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.views} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val: number) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : String(val)} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" isAnimationActive />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartEmpty text="Daily views will appear here once YouTube Analytics is synced for this channel." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.subscriberGrowth")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.subscriberGrowth.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.subscriberGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val: number) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : String(val)} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartEmpty text="Subscriber growth will appear here once YouTube Analytics is synced for this channel." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.watchTime")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.watchTimeMinutes.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.watchTimeMinutes.map(d => ({ ...d, value: d.value / 60 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val: number) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : String(val)} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => [`${Number(val).toFixed(1)} h`, t("charts.watchTime")]} />
                        <Bar dataKey="value" fill="#818CF8" radius={[4, 4, 0, 0]} isAnimationActive />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartEmpty text="Watch time will appear here once YouTube Analytics is synced for this channel." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.estRevenue")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.estimatedRevenue.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.estimatedRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} minTickGap={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val: number) => `$${val}`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => [`$${Number(val).toFixed(2)}`, t("charts.estRevenue")]} />
                        <Area type="monotone" dataKey="value" stroke="#34D399" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" isAnimationActive />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartEmpty text="Revenue reporting requires YouTube monetization access — it will appear here once available." />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Videos Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("table.topVideos")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topVideos.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-mute">
                  Your top videos will appear here as soon as YouTube Analytics reports real data for this channel.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{t("table.rank")}</TableHead>
                      <TableHead>{t("table.video")}</TableHead>
                      <TableHead className="text-right">{t("table.views")}</TableHead>
                      <TableHead className="text-right">{t("table.watchTime")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topVideos.map((video, index) => (
                      <TableRow key={video.id}>
                        <TableCell className="font-medium text-ink-mute">#{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-paper-low flex-shrink-0">
                              {video.thumbnailUrl ? (
                                <Image 
                                  src={video.thumbnailUrl} 
                                  alt={video.title}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Video className="h-4 w-4 text-ink-faint" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-ink line-clamp-1">{video.title}</p>
                              {video.publishedAt && (
                                <p className="text-xs text-ink-mute" suppressHydrationWarning>{new Date(video.publishedAt).toLocaleDateString("en-US")}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-ink" suppressHydrationWarning>
                          {video.views.toLocaleString("en-US")}
                        </TableCell>
                        <TableCell className="text-right text-ink-soft" suppressHydrationWarning>
                          {video.watchTimeMinutes == null
                            ? "—"
                            : `${(video.watchTimeMinutes / 60).toLocaleString("en-US", { maximumFractionDigits: 1 })}h`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
