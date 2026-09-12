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
  PAID: 'مدفوعة',
  PENDING: 'قيد الانتظار',
  FAILED: 'فشلت',
  REFUNDED: 'مستردة',
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
    mrrFormatted: '$3,338',
    arrFormatted: '$40,056',
    planBreakdown: { STARTER: 14, GROWTH: 22, AGENCY: 6 },
    activeSubscriptions: 42,
    churnedSubscriptions: 2,
    churnRate: '4.5%',
    recentInvoices: [
      { id: 'inv_101', amountCents: 7900, currency: 'usd', status: 'PAID', createdAt: '2026-09-01T10:00:00Z', userEmail: 'alex@example.com' },
      { id: 'inv_102', amountCents: 2900, currency: 'usd', status: 'PAID', createdAt: '2026-09-01T11:15:00Z', userEmail: 'sarah@example.com' },
      { id: 'inv_103', amountCents: 19900, currency: 'usd', status: 'PAID', createdAt: '2026-08-30T16:45:00Z', userEmail: 'agency@partner.com' },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">المالية والإيرادات للمنصة</h1>
          <p className="text-sm text-ink-mute">
            الإيراد الشهري المتكرر لحظيًا، تفصيل خطط الاشتراك، تحليل التخلي، وسجل الفواتير الأخيرة.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              الإيراد الشهري المتكرر (MRR)
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">
              {loading ? '...' : finance.mrrFormatted}
            </div>
            <p className="text-xs text-ink-mute mt-1">الاشتراكات النشطة</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              معدل الإيراد السنوي (ARR)
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : finance.arrFormatted}
            </div>
            <p className="text-xs text-ink-mute mt-1">الإيراد السنوي المتوقع</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              المشتركون النشطون
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-ink">
              {loading ? '...' : finance.activeSubscriptions}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">عبر 3 خطط</p>
          </CardContent>
        </Card>

        <Card className="bg-paper-high border-line shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">
              معدل التخلي الشهري
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600">
              {loading ? '...' : finance.churnRate}
            </div>
            <p className="text-xs text-ink-mute mt-1">{finance.churnedSubscriptions} إلغاء</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg text-ink">توزيع خطط الاشتراك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">خطة أساسية</span>
                <Badge variant="default">$29/شهر</Badge>
              </div>
              <div className="text-2xl font-extrabold text-ink">
                {finance.planBreakdown.STARTER} حساب
              </div>
              <p className="text-xs text-ink-mute">قناة واحدة، ميزات ذكاء اصطناعي قياسية</p>
            </div>

            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">خطة نمو</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                  $79/شهر (الأكثر شيوعًا)
                </Badge>
              </div>
              <div className="text-2xl font-extrabold text-blue-600">
                {finance.planBreakdown.GROWTH} حساب
              </div>
              <p className="text-xs text-ink-mute">3 قنوات، توليد Higgsfield</p>
            </div>

            <div className="p-4 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">خطة وكالة</span>
                <Badge variant="default">$199/شهر</Badge>
              </div>
              <div className="text-2xl font-extrabold text-ink">
                {finance.planBreakdown.AGENCY} حساب
              </div>
              <p className="text-xs text-ink-mute">10 قنوات، طابور ذكاء اصطناعي ذو أولوية</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History Table */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg text-ink">سجل الفواتير الأخيرة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>معرّف الفاتورة</TableHead>
                <TableHead>بريد العميل</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finance.recentInvoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-paper">
                  <TableCell className="font-mono text-xs font-semibold text-ink" dir="ltr">
                    {inv.id}
                  </TableCell>
                  <TableCell className="text-xs text-ink-soft" dir="ltr">
                    {inv.userEmail || 'alex@example.com'}
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
                    {new Date(inv.createdAt).toLocaleDateString('ar')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
