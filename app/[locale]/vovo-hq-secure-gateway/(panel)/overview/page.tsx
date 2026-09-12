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
  apiErrorRate: string;
  queueBacklog: number;
  uptime: string;
  systemHealth: {
    database: HealthItem;
    aiEngine: HealthItem;
    guardian: HealthItem;
    redis: HealthItem;
  };
  activeSubscriptions: number;
}

const HEALTH_TITLES: Record<keyof OverviewKPIs['systemHealth'], string> = {
  database: 'قاعدة البيانات (PostgreSQL)',
  aiEngine: 'محرك الذكاء الاصطناعي',
  guardian: 'الحارس الأمني',
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
          <h1 className="text-2xl font-bold text-ink tracking-tight">نظرة عامة على المنصة — HQ</h1>
          <p className="text-sm text-ink-mute">
            قياسات المنصة لحظيًا، إحصاءات المستخدمين، حالة الأمان، وصحة النظام.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200 py-1 px-3">
            النظام يعمل {kpis?.uptime ?? '99.98%'}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>إجمالي المستخدمين</span>
              <span className="text-lg">👥</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : (kpis?.totalUsers ?? '—')}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              ↑ +{kpis?.newUsersThisMonth ?? 0} هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>القنوات النشطة</span>
              <span className="text-lg">📺</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : (kpis?.activeChannels ?? '—')}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {kpis?.activeSubscriptions ?? '—'} اشتراك نشط
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>الإيراد الشهري المتكرر</span>
              <span className="text-lg">💳</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : (kpis?.mrrFormatted ?? '—')}
            </div>
            <p className="text-xs text-ink-mute mt-1">محسوب من الاشتراكات النشطة</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line hover:border-line-strong transition-all shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute uppercase tracking-wider">
              <span>معدل أخطاء الواجهة</span>
              <span className="text-lg">⚡</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">
              {loading ? '...' : (kpis?.apiErrorRate ?? '—')}
            </div>
            <p className="text-xs text-ink-mute mt-1">أعمال الانتظار: {kpis?.queueBacklog ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators (live checks) */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg text-ink flex items-center justify-between">
            <span>🛡️ صحة النظام والبنية التحتية</span>
            <Badge variant="default" className="text-xs">
              فحص مباشر
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
                          ? 'يراقب المصادقة وحدود المعدل والإقفالات على جميع المسارات.'
                          : 'يعمل ضمن الحدود الطبيعية.'
                        : 'غير مهيأ — فعِّل الإعداد المطلوب في ملف البيئة.'}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-ink-mute">جارٍ فحص الحالة...</div>
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
                صندوق رسائل وبلاغات التواصل والمشاكل
              </CardTitle>
              <p className="text-xs text-ink-mute">
                جميع البلاغات والرسائل المرسلة من زوار وعملاء الموقع محفوظة هنا لحظياً.
              </p>
            </div>
          </div>
          <Badge variant="default" className="bg-paper-low text-ink font-mono text-xs">
            {data?.inquiries?.length ?? 0} رسالة وبلاغ
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
                      <span>{new Date(inq.createdAt).toLocaleString('ar-EG')}</span>
                      <a
                        href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                        className="font-medium text-red-600 hover:underline"
                      >
                        رد مباشر ↗
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
              لا توجد بلاغات أو رسائل جديدة حالياً.
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
                <h3 className="font-bold text-ink group-hover:text-blue-600 transition-colors">إدارة المستخدمين</h3>
                <p className="text-xs text-ink-mute">البحث في المستخدمين، عرض القنوات، إيقاف/إعادة تفعيل الحسابات.</p>
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
                <h3 className="font-bold text-ink group-hover:text-red-600 transition-colors">محادثة الحارس الأمني</h3>
                <p className="text-xs text-ink-mute">اسأل الحارس الأمني الذكي عن تسجيلات الدخول والإقفالات والتهديدات.</p>
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
                <h3 className="font-bold text-ink group-hover:text-amber-600 transition-colors">سجلات التدقيق</h3>
                <p className="text-xs text-ink-mute">البحث في سجل غير قابل للتعديل لجميع الإجراءات الحساسة على المنصة.</p>
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
                <h3 className="font-bold text-ink group-hover:text-emerald-600 transition-colors">المالية والإيراد المتكرر</h3>
                <p className="text-xs text-ink-mute">نظرة على الإيرادات، تفصيل خطط الاشتراك، ومعدل التخلي.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
