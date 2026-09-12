'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PlanView {
  id: string;
  name: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  channels: string;
  videos: string;
  analytics: string;
  features: string[];
  popular: boolean;
}

const PLAN_IDS: Record<string, string> = {
  starter: 'أساسي',
  growth: 'نمو',
  agency: 'وكالة',
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sitePlan, setSitePlan] = useState('all');
  const [siteDuration, setSiteDuration] = useState('1');
  const [siteSending, setSiteSending] = useState(false);
  const [siteTarget, setSiteTarget] = useState<'all' | 'user'>('all');
  const [siteUserId, setSiteUserId] = useState('');
  const [siteUsers, setSiteUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [autoTrialEnabled, setAutoTrialEnabled] = useState(false);
  const [togglingTrial, setTogglingTrial] = useState(false);

  useEffect(() => {
    fetch('/api/admin/plans')
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || []);
        setAutoTrialEnabled(Boolean(d.autoTrialEnabled));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setSiteUsers(d.users || []))
      .catch(() => {});
  }, []);

  function updateField(id: string, field: 'name' | 'monthlyPrice' | 'yearlyPrice', value: string) {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]: field === 'name' ? value : value === '' ? 0 : Number(value),
            }
          : p
      )
    );
  }

  async function save(id: string) {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    setSaving(id);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: plan.name,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast(`تم حفظ خطة ${plan.name || id}.`);
      } else {
        setToast(data.error || 'تعذّر الحفظ.');
      }
    } catch {
      setToast('حدث خطأ أثناء الحفظ.');
    } finally {
      setSaving(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-4 rounded-xl bg-ink text-paper-high font-medium text-sm flex items-center justify-between shadow-lg">
          <span>ℹ️ {toast}</span>
          <button onClick={() => setToast(null)} className="text-ink-faint hover:text-paper-high text-xs">إغلاق</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-ink">إدارة الخطط والأسعار</h1>
        <p className="text-sm text-ink-mute">
          غيّر أسماء الخطط وأسعارها الشهرية والسنوية — تنعكس فورًا على صفحة التسعير وعملية الدفع.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-ink-mute">جارٍ تحميل الخطط...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (            <Card key={plan.id} className={plan.popular ? 'border-gold-400' : 'border-line'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant="default">{PLAN_IDS[plan.id] || plan.id}</Badge>
                </div>
                <p className="text-xs text-ink-mute">{plan.desc}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-soft">اسم الخطة</label>
                  <Input
                    value={plan.name}
                    onChange={(e) => updateField(plan.id, 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-soft">السعر الشهري ($)</label>
                    <Input
                      type="number"
                      min={0}
                      value={plan.monthlyPrice}
                      onChange={(e) => updateField(plan.id, 'monthlyPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-soft">السعر السنوي ($)</label>
                    <Input
                      type="number"
                      min={0}
                      value={plan.yearlyPrice}
                      onChange={(e) => updateField(plan.id, 'yearlyPrice', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={saving === plan.id}
                  onClick={() => save(plan.id)}
                >
                  {saving === plan.id ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* تفعيل / إيقاف الفترة التجريبية التلقائية */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>⚡ الفترة التجريبية التلقائية للعملاء الجدد (14 يوماً)</span>
                <Badge variant={autoTrialEnabled ? 'green' : 'warning'}>
                  {autoTrialEnabled ? 'مفعلة — 14 يوماً مجاناً' : 'معطلة — الاشتراك إلزامي للبدء'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-ink-mute mt-1">
                {autoTrialEnabled
                  ? 'أي عميل جديد يسجل بالموقع يحصل على 14 يوماً تجربة مجانية ويبدأ الوكيل الذكي بالعمل معه فوراً.'
                  : 'الوكيل الذكي متوقف للعملاء الجدد حتى يشتركوا في إحدى الخطط، أو يتم إطلاق حدث وصول مجاني من الأسفل.'}
              </p>
            </div>
            <Button
              variant={autoTrialEnabled ? 'secondary' : 'green'}
              disabled={togglingTrial}
              onClick={async () => {
                setTogglingTrial(true);
                try {
                  const nextVal = !autoTrialEnabled;
                  const res = await fetch('/api/admin/plans', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ autoTrialEnabled: nextVal }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setAutoTrialEnabled(data.autoTrialEnabled);
                    setToast(
                      data.autoTrialEnabled
                        ? 'تم تفعيل الفترة التجريبية التلقائية (14 يوماً) لجميع العملاء الجدد.'
                        : 'تم تعطيل التجربة التلقائية — أصبح الاشتراك إلزامياً لبدء عمل الوكيل.'
                    );
                  }
                } finally {
                  setTogglingTrial(false);
                  setTimeout(() => setToast(null), 3000);
                }
              }}
            >
              {togglingTrial ? '...' : autoTrialEnabled ? 'تعطيل التجربة التلقائية' : 'تفعيل 14 يوماً تجربة مجانية'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* وصول مجاني للموقع بالكامل */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle>🎁 وصول مجاني للموقع</CardTitle>
          <p className="text-xs text-ink-mute">
            افتح خطة (أو كل الخطط) مجانًا — للجميع أو لشخص محدد — لمدة تحدّدها.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* اختيار الهدف */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">المستفيد</label>
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1">
              <button
                type="button"
                onClick={() => setSiteTarget('all')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  siteTarget === 'all' ? 'bg-ink text-paper-high' : 'text-ink-mute hover:text-ink'
                }`}
              >
                الجميع
              </button>
              <button
                type="button"
                onClick={() => setSiteTarget('user')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  siteTarget === 'user' ? 'bg-ink text-paper-high' : 'text-ink-mute hover:text-ink'
                }`}
              >
                شخص محدد
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* اختيار الشخص عند اختيار "شخص محدد" */}
            {siteTarget === 'user' && (
              <select
                value={siteUserId}
                onChange={(e) => setSiteUserId(e.target.value)}
                className="h-10 min-w-[220px] rounded-md border border-line bg-paper-high px-3 text-sm"
              >
                <option value="">اختر المستخدم...</option>
                {siteUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.email})
                  </option>
                ))}
              </select>
            )}

            <select
              value={sitePlan}
              onChange={(e) => setSitePlan(e.target.value)}
              className="h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
            >
              <option value="all">كل الخطط</option>
              <option value="starter">أساسي</option>
              <option value="growth">نمو</option>
              <option value="agency">وكالة</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={siteDuration}
                onChange={(e) => setSiteDuration(e.target.value)}
                placeholder="المدة"
                className="w-24 h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
              />
              <span className="text-xs text-ink-mute">يوم</span>
            </div>

            <Button
              variant="green"
              disabled={siteSending || (siteTarget === 'user' && !siteUserId)}
              onClick={async () => {
                setSiteSending(true);
                try {
                  const r = await fetch('/api/admin/site-free', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: siteTarget === 'user' ? siteUserId : null,
                      planId: sitePlan === 'all' ? null : sitePlan,
                      durationDays: Number(siteDuration) || 1,
                    }),
                  });
                  const d = await r.json();
                  setToast(
                    d.ok
                      ? siteTarget === 'user'
                        ? 'تم منح الوصول المجاني للمستخدم.'
                        : 'تم تفعيل الوصول المجاني للموقع.'
                      : d.error || 'تعذّر التفعيل.'
                  );
                } finally {
                  setSiteSending(false);
                  setTimeout(() => setToast(null), 3000);
                }
              }}
            >
              {siteSending ? '...' : siteTarget === 'user' ? 'منح المجاني للشخص' : 'تفعيل الوصول المجاني'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
