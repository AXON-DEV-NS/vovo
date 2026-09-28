'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ADMIN_ROUTES } from '@/lib/constants';

interface HealthItem {
  ok: boolean;
  label: string;
}

interface OverviewKPIs {
  totalUsers: number;
  activeChannels: number;
  totalContentItems: number;
  mrrFormatted: string;
  newUsersThisMonth: number;
  securityWarnings: number;
  queueBacklog: number;
  allSystemsOk: boolean;
  systemHealth: {
    database: HealthItem;
    aiEngine: HealthItem;
    guardian: HealthItem;
    redis: HealthItem;
  };
  activeSubscriptions: number;
}

const HEALTH_TITLES: Record<keyof OverviewKPIs['systemHealth'], string> = {
  database: 'Database (PostgreSQL)',
  aiEngine: 'AI engine',
  guardian: 'Security guardian',
  redis: 'Redis',
};

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<{ kpis: OverviewKPIs; inquiries?: ContactInquiry[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch overview data:', err);
        setLoading(false);
      });
  }, []);

  const kpis = data?.kpis;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Platform overview — HQ</h1>
          <p className="text-sm text-ink-mute">
            Real-time platform metrics, user statistics, security posture, and system health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="default"
            className={`py-1 px-3 ${
              kpis
                ? kpis.allSystemsOk
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-paper-low text-ink-mute border-line'
            }`}
          >
            {kpis
              ? kpis.allSystemsOk
                ? 'All systems operational'
                : 'Degraded — see health below'
              : 'Checking system...'}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>Total users</span>
              <span className="text-lg">👥</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : (kpis?.totalUsers ?? '—')}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              ↑ +{kpis?.newUsersThisMonth ?? 0} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>Active channels</span>
              <span className="text-lg">📺</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : (kpis?.activeChannels ?? '—')}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {kpis?.activeSubscriptions ?? '—'} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>Monthly recurring revenue</span>
              <span className="text-lg">💳</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : (kpis?.mrrFormatted ?? '—')}
            </div>
            <p className="text-xs text-ink-mute mt-1">Calculated from active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>Security warnings (30d)</span>
              <span className="text-lg">🛡️</span>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-extrabold ${
                (kpis?.securityWarnings ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {loading ? '...' : (kpis?.securityWarnings ?? 0)}
            </div>
            <p className="text-xs text-ink-mute mt-1">Queue backlog: {kpis?.queueBacklog ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators (live checks) */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg text-ink flex items-center justify-between">
            <span>🛡️ System & infrastructure health</span>
            <Badge variant="default" className="text-xs">
              Live check
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpis ? (
              (Object.keys(kpis.systemHealth) as (keyof OverviewKPIs['systemHealth'])[]).map((key) => {
                const item = kpis.systemHealth[key];
                return (
                  <div key={key} className="p-4 rounded-xl bg-paper border border-line space-y-1">
                    <div className="text-xs font-medium text-ink-mute">{HEALTH_TITLES[key]}</div>
                    <div
                      className={`text-base font-bold flex items-center gap-2 ${
                        item.ok ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.ok ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      ></span>
                      <span>{item.label}</span>
                    </div>
                    <p className="text-xs text-ink-mute pt-1">
                      {item.ok
                        ? key === 'guardian'
                          ? 'Monitors authentication, rate limits, and lockouts across all routes.'
                          : 'Operating within normal bounds.'
                        : 'Not configured — enable the required setting in the environment file.'}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-ink-mute">Checking status...</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Issue Reports Inbox */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader className="pb-3 border-b border-line flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-base">
              📥
            </div>
            <div>
              <CardTitle className="text-base text-ink font-bold">
                Contact & issue reports inbox
              </CardTitle>
              <p className="text-xs text-ink-mute">
                All reports and messages sent by site visitors and clients are saved here in real time.
              </p>
            </div>
          </div>
          <Badge variant="default" className="bg-paper-low text-ink font-mono text-xs">
            {data?.inquiries?.length ?? 0} messages & reports
          </Badge>
        </CardHeader>
        <CardContent className="p-6">
          {data?.inquiries && data.inquiries.length > 0 ? (
            <div className="space-y-4">
              {data.inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-4 rounded-xl border border-line bg-paper/40 hover:bg-paper-low transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink">{inq.name}</span>
                      <span className="text-xs text-ink-mute font-mono">({inq.email})</span>
                      <Badge variant="default" className="text-[11px] bg-red-50 text-red-700 border-red-200">
                        {inq.subject}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-faint">
                      <span>{new Date(inq.createdAt).toLocaleString('en-US')}</span>
                      <a
                        href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Reply ↗
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed font-sans">
                    {inq.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-mute text-center py-6">
              No new reports or messages right now.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Admin Modules Quick Launch */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link href={ADMIN_ROUTES.users} className="block group">
          <Card className="bg-paper-high border-line group-hover:border-ink-faint group-hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                👥
              </div>
              <div>
                <h3 className="font-bold text-ink group-hover:text-blue-600 transition-colors">User management</h3>
                <p className="text-xs text-ink-mute">Search users, view channels, suspend/reactivate accounts.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={ADMIN_ROUTES.securityChat} className="block group">
          <Card className="bg-paper-high border-line group-hover:border-red-400 group-hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center text-xl font-bold">
                🛡️
              </div>
              <div>
                <h3 className="font-bold text-ink group-hover:text-red-600 transition-colors">Security guardian chat</h3>
                <p className="text-xs text-ink-mute">Ask the smart security guardian about logins, lockouts, and threats.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={ADMIN_ROUTES.auditLogs} className="block group">
          <Card className="bg-paper-high border-line group-hover:border-amber-400 group-hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
                📜
              </div>
              <div>
                <h3 className="font-bold text-ink group-hover:text-amber-600 transition-colors">Audit logs</h3>
                <p className="text-xs text-ink-mute">Search the immutable log of all sensitive platform actions.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={ADMIN_ROUTES.finance} className="block group">
          <Card className="bg-paper-high border-line group-hover:border-emerald-400 group-hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                💳
              </div>
              <div>
                <h3 className="font-bold text-ink group-hover:text-emerald-600 transition-colors">Finance & recurring revenue</h3>
                <p className="text-xs text-ink-mute">Revenue overview, subscription plan breakdown, and churn rate.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
