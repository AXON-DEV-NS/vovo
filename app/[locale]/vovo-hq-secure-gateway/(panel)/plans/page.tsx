'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

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
  starter: 'Starter',
  growth: 'Growth',
  agency: 'Agency',
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
        setToast(`Saved plan ${plan.name || id}.`);
      } else {
        setToast(data.error || 'Failed to save.');
      }
    } catch {
      setToast('An error occurred while saving.');
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
          <button onClick={() => setToast(null)} className="text-ink-faint hover:text-paper-high text-xs">Close</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-ink">Plans & pricing management</h1>
        <p className="text-sm text-ink-mute">
          Change plan names and their monthly and yearly prices — reflected immediately on the pricing page and checkout.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-ink-mute">Loading plans...</div>
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
                  <label className="mb-1.5 block text-sm font-medium text-ink-soft">Plan name</label>
                  <Input
                    value={plan.name}
                    onChange={(e) => updateField(plan.id, 'name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-soft">Monthly price ($)</label>
                    <Input
                      type="number"
                      min={0}
                      value={plan.monthlyPrice}
                      onChange={(e) => updateField(plan.id, 'monthlyPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-soft">Yearly price ($)</label>
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
                  {saving === plan.id ? 'Saving...' : 'Save changes'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enable / disable automatic trial */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>⚡ Automatic trial for new customers (14 days)</span>
                <Badge variant={autoTrialEnabled ? 'green' : 'warning'}>
                  {autoTrialEnabled ? 'Enabled — 14 days free' : 'Disabled — subscription required to start'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-ink-mute mt-1">
                {autoTrialEnabled
                  ? 'Any new customer who signs up gets a 14-day free trial and the AI agent starts working with them immediately.'
                  : 'The AI agent is paused for new customers until they subscribe to a plan, or a free-access event is launched below.'}
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
                        ? 'Automatic trial (14 days) enabled for all new customers.'
                        : 'Automatic trial disabled — a subscription is now required for the agent to start.'
                    );
                  }
                } finally {
                  setTogglingTrial(false);
                  setTimeout(() => setToast(null), 3000);
                }
              }}
            >
              {togglingTrial ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : autoTrialEnabled ? (
                'Disable automatic trial'
              ) : (
                'Enable 14-day free trial'
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Site-wide free access */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle>🎁 Site-wide free access</CardTitle>
          <p className="text-xs text-ink-mute">
            Open a plan (or all plans) for free — for everyone or for a specific person — for a duration you choose.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Beneficiary</label>
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1">
              <button
                type="button"
                onClick={() => setSiteTarget('all')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  siteTarget === 'all' ? 'bg-ink text-paper-high' : 'text-ink-mute hover:text-ink'
                }`}
              >
                Everyone
              </button>
              <button
                type="button"
                onClick={() => setSiteTarget('user')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  siteTarget === 'user' ? 'bg-ink text-paper-high' : 'text-ink-mute hover:text-ink'
                }`}
              >
                Specific person
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* User picker when "Specific person" is chosen */}
            {siteTarget === 'user' && (
              <select
                value={siteUserId}
                onChange={(e) => setSiteUserId(e.target.value)}
                className="h-10 min-w-[220px] rounded-md border border-line bg-paper-high px-3 text-sm"
              >
                <option value="">Select a user...</option>
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
              <option value="all">All plans</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="agency">Agency</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={siteDuration}
                onChange={(e) => setSiteDuration(e.target.value)}
                placeholder="Duration"
                className="w-24 h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
              />
              <span className="text-xs text-ink-mute">days</span>
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
                        ? 'Free access granted to the user.'
                        : 'Site-wide free access enabled.'
                      : d.error || 'Failed to enable.'
                  );
                } finally {
                  setSiteSending(false);
                  setTimeout(() => setToast(null), 3000);
                }
              }}
            >
              {siteSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : siteTarget === 'user' ? (
                'Grant free access to person'
              ) : (
                'Enable free access'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
