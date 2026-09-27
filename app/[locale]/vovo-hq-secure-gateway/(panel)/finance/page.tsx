'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface FinanceData {
  mrrFormatted: string;
  arrFormatted: string;
  planBreakdown: { STARTER: number; GROWTH: number; AGENCY: number };
  activeSubscriptions: number;
  churnedSubscriptions: number;
  churnRate: string;
  recentInvoices: {
    id: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: string;
    userEmail?: string;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export default function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/finance')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch finance data:', err);
        setLoading(false);
      });
  }, []);

  const finance = data || {
    mrrFormatted: '$0',
    arrFormatted: '$0',
    planBreakdown: { STARTER: 0, GROWTH: 0, AGENCY: 0 },
    activeSubscriptions: 0,
    churnedSubscriptions: 0,
    churnRate: '0%',
    recentInvoices: [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Platform finance & revenue</h1>
          <p className="text-sm text-ink-mute">
            Real-time monthly recurring revenue, subscription plan breakdown, churn analysis, and recent invoices.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              Monthly recurring revenue (MRR)
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">
              {loading ? '...' : finance.mrrFormatted}
            </div>
            <p className="text-xs text-ink-mute mt-1">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              Annual recurring revenue (ARR)
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : finance.arrFormatted}
            </div>
            <p className="text-xs text-ink-mute mt-1">Projected annual revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              Active subscribers
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : finance.activeSubscriptions}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Across 3 plans</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              Monthly churn rate
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600">
              {loading ? '...' : finance.churnRate}
            </div>
            <p className="text-xs text-ink-mute mt-1">{finance.churnedSubscriptions} cancellations</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg text-ink">Subscription plan breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">Starter plan</span>
                <Badge variant="default">$29/mo</Badge>
              </div>
              <div className="text-2xl font-extrabold text-ink">
                {finance.planBreakdown.STARTER} accounts
              </div>
              <p className="text-xs text-ink-mute">One channel, standard AI features</p>
            </div>

            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">Growth plan</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                  $79/mo (most popular)
                </Badge>
              </div>
              <div className="text-2xl font-extrabold text-blue-600">
                {finance.planBreakdown.GROWTH} accounts
              </div>
              <p className="text-xs text-ink-mute">3 channels, Higgsfield generation</p>
            </div>

            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">Agency plan</span>
                <Badge variant="default">$199/mo</Badge>
              </div>
              <div className="text-2xl font-extrabold text-ink">
                {finance.planBreakdown.AGENCY} accounts
              </div>
              <p className="text-xs text-ink-mute">10 channels, priority AI queue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History Table */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg text-ink">Recent invoice history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finance.recentInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-ink-mute">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              ) : (
                finance.recentInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-paper">
                    <TableCell className="font-mono text-xs font-semibold text-ink" dir="ltr">
                      {inv.id}
                    </TableCell>
                    <TableCell className="text-xs text-ink-soft" dir="ltr">
                      {inv.userEmail || '—'}
                    </TableCell>
                    <TableCell className="font-bold text-ink" dir="ltr">
                      ${(inv.amountCents / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        {STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-ink-mute">
                      {new Date(inv.createdAt).toLocaleDateString('en-US')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
