'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  active: boolean;
  expiryDate: string | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCodes = () => {
    fetch('/api/admin/promo-codes')
      .then((r) => r.json())
      .then((d) => {
        setCodes(d.codes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: Number(discountValue),
          expiryDate: expiryDate || null,
          maxUses: maxUses ? Number(maxUses) : null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast('تم إنشاء كود الخصم.');
        setCode('');
        setDiscountValue('');
        setExpiryDate('');
        setMaxUses('');
        fetchCodes();
      } else {
        setToast(data.error || 'تعذّر الإنشاء.');
      }
    } catch {
      setToast('حدث خطأ.');
    } finally {
      setCreating(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/promo-codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    fetchCodes();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
    fetchCodes();
  }

  const discountLabel = (c: PromoCode) =>
    c.discountType === 'percent' ? `${c.discountValue}%` : `$${c.discountValue}`;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-4 rounded-xl bg-ink text-paper-high font-medium text-sm flex items-center justify-between shadow-lg">
          <span>ℹ️ {toast}</span>
          <button onClick={() => setToast(null)} className="text-ink-faint hover:text-paper-high text-xs">إغلاق</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-ink">أكواد الخصم</h1>
        <p className="text-sm text-ink-mute">
          أنشئ أكواد خصم يطبقها المستخدمون عند الدفع — خصم نسبي أو مبلغ ثابت تحدده أنت.
        </p>
      </div>

      {/* Create form */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardHeader>
          <CardTitle>إنشاء كود جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">الكود</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">نوع الخصم</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                className="h-10 w-full rounded-md border border-line bg-paper-high px-3 text-sm"
              >
                <option value="percent">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت ($)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">قيمة الخصم</label>
              <Input
                type="number"
                min={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '20' : '10'}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">تاريخ الانتهاء (اختياري)</label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-soft">حد الاستخدام</label>
                <Input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="∞"
                />
              </div>
              <Button type="submit" variant="primary" className="h-10" disabled={creating}>
                {creating ? '...' : 'إنشاء'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-ink-mute">جارٍ التحميل...</div>
          ) : codes.length === 0 ? (
            <div className="p-6 text-sm text-ink-mute">لا توجد أكواد خصم بعد.</div>
          ) : (
            <div className="divide-y divide-line">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink">{c.code}</span>
                      <Badge variant={c.active ? 'default' : 'error'} className={c.active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : ''}>
                        {c.active ? 'مفعّل' : 'معطّل'}
                      </Badge>
                    </div>
                    <div className="text-xs text-ink-mute mt-1">
                      خصم {discountLabel(c)}
                      {c.expiryDate ? ` · ينتهي ${new Date(c.expiryDate).toLocaleDateString('ar')}` : ''}
                      {c.maxUses ? ` · ${c.usedCount}/${c.maxUses} استخدام` : ' · غير محدود'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggle(c.id, !c.active)}
                    >
                      {c.active ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(c.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
