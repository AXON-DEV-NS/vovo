"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton, StatCardSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, TrendingUp, DollarSign, Clock, BarChart3 } from "lucide-react";
import Image from "next/image";
import type { ChannelAnalytics, DateRangePreset } from "@/lib/analytics/data-layer";

const MOCK_CHANNELS = [
  { id: "1", nameKey: "channels.techInsights" },
  { id: "2", nameKey: "channels.aiDaily" },
];

const PRESETS: DateRangePreset[] = ["7d", "30d", "90d"];

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const [channelId, setChannelId] = useState("1");
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [data, setData] = useState<ChannelAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  const totalViews = data?.views.reduce((acc, curr) => acc + curr.value, 0) ?? 0;
  const latestSubscribers = data?.subscriberGrowth.length ? data.subscriberGrowth[data.subscriberGrowth.length - 1].value : 0;
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
          <div className="flex bg-paper-low rounded-xl p-1">
            {MOCK_CHANNELS.map((ch) => (
              <Button
                key={ch.id}
                variant={channelId === ch.id ? "primary" : "ghost"}
                size="sm"
                onClick={() => setChannelId(ch.id)}
                className="rounded-lg shadow-none"
              >
                {t(ch.nameKey)}
              </Button>
            ))}
          </div>

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

      {isLoading ? (
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
      ) : !data ? (
        <EmptyState 
          icon={<BarChart3 className="h-8 w-8 text-ink-faint" />}
          title={t("emptyState.title")}
          description={t("emptyState.description")}
        />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.totalViews")}</p>
                  <Eye className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>{totalViews.toLocaleString("en-US")}</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.subscriberGrowth")}</p>
                  <TrendingUp className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>{latestSubscribers.toLocaleString("en-US")}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.watchTime")}</p>
                  <Clock className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>{totalWatchTime.toLocaleString("en-US", { maximumFractionDigits: 1 })} h</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-ink-mute">{t("stats.estRevenue")}</p>
                  <DollarSign className="h-4 w-4 text-ink-faint" />
                </div>
                <p className="text-2xl font-bold text-ink" suppressHydrationWarning>${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.subscriberGrowth")}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.watchTime")}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.estRevenue")}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Top Videos Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("table.topVideos")}</CardTitle>
            </CardHeader>
            <CardContent>
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
                            <Image 
                              src={video.thumbnailUrl} 
                              alt={video.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                              unoptimized
                            />
                          </div>
                          <div>
                            <p className="font-medium text-ink line-clamp-1">{video.title}</p>
                            <p className="text-xs text-ink-mute" suppressHydrationWarning>{new Date(video.publishedAt).toLocaleDateString("en-US")}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-ink" suppressHydrationWarning>
                        {video.views.toLocaleString("en-US")}
                      </TableCell>
                      <TableCell className="text-right text-ink-soft" suppressHydrationWarning>
                        {(video.watchTimeMinutes / 60).toLocaleString("en-US", { maximumFractionDigits: 1 })}h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
