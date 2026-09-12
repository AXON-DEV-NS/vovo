'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface AdminUser {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  channels: { id: string; title: string; subscriberCount: number }[];
  subscription?: { plan: string; status: string } | null;
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'أساسي',
  GROWTH: 'نمو',
  AGENCY: 'وكالة',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalAction, setModalAction] = useState<'suspend' | 'reactivate' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [warnMessage, setWarnMessage] = useState('');
  const [warnSending, setWarnSending] = useState(false);
  const [freePlanId, setFreePlanId] = useState('starter');
  const [freeDuration, setFreeDuration] = useState('30');
  const [freeSending, setFreeSending] = useState(false);

  const fetchUsers = (query: string) => {
    setLoading(true);
    fetch(`/api/admin/users?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((d) => {
        setUsers(d.users || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch users:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers('');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  // Live client-side filter as the admin types.
  const filteredUsers = users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(search.trim().toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleConfirmAction = async () => {
    if (!selectedUser || !modalAction) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: modalAction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setToast(
        data.message ||
          (modalAction === 'suspend'
            ? 'تم إيقاف الحساب بنجاح.'
            : 'تمت إعادة تفعيل الحساب بنجاح.')
      );
      fetchUsers(search);
      setModalAction(null);
      setSelectedUser(null);
    } catch (err: any) {
      setToast(`خطأ: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-4 rounded-xl bg-ink text-paper-high font-medium text-sm flex items-center justify-between shadow-lg">
          <span>ℹ️ {toast}</span>
          <button onClick={() => setToast(null)} className="text-ink-faint hover:text-paper-high text-xs">
            إغلاق
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">إدارة المستخدمين — HQ</h1>
          <p className="text-sm text-ink-mute">
            ابحث في المستخدمين، افحص قنوات يوتيوب المتصلة والاشتراكات، وأوقف/أعد تفعيل الحسابات.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <Input
              type="text"
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              بحث
            </Button>
            {search && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  fetchUsers('');
                }}
              >
                مسح
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم / البريد</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>القنوات</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    جارٍ تحميل المستخدمين...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    لا يوجد مستخدمون بعد.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    لا يوجد مستخدمون مطابقون للبحث.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-paper">
                    <TableCell>
                      <div>
                        <div className="font-semibold text-ink">{user.name || 'مستخدم بلا اسم'}</div>
                        <div className="text-xs text-ink-mute font-mono" dir="ltr">{user.email}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="default" className="text-xs font-mono">
                        {user.role}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {user.status === 'SUSPENDED' ? (
                        <Badge variant="error" className="bg-red-100 text-red-800 border-red-200">
                          موقوف
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          نشط
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-ink-soft">
                        {user.channels.length > 0 ? (
                          <div className="space-y-0.5">
                            {user.channels.map((ch) => (
                              <div key={ch.id} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>{ch.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-ink-faint">لا توجد قنوات مرتبطة</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-bold text-ink-soft">
                        {PLAN_LABELS[user.subscription?.plan || 'STARTER'] || user.subscription?.plan || 'أساسي'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUser(user)}
                        >
                          عرض التفاصيل
                        </Button>

                        {user.status === 'SUSPENDED' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setModalAction('reactivate');
                            }}
                          >
                            إعادة تفعيل
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setSelectedUser(user);
                              setModalAction('suspend');
                            }}
                          >
                            إيقاف
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && !modalAction && (
        <Modal
          open={true}
          onClose={() => setSelectedUser(null)}
          title={`تفاصيل المستخدم — ${selectedUser.email}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-ink-mute block">الاسم الكامل</span>
                <span className="font-semibold">{selectedUser.name || 'غير متوفر'}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">الدور</span>
                <span className="font-semibold">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">حالة الحساب</span>
                <span className="font-semibold">{selectedUser.status === 'ACTIVE' ? 'نشط' : 'موقوف'}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">عضو منذ</span>
                <span className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString('ar')}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">الخطة</span>
                <span className="font-semibold">
                  {PLAN_LABELS[selectedUser.subscription?.plan || 'STARTER'] || 'أساسي'}
                </span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">حالة الاشتراك</span>
                <span className="font-semibold">
                  {selectedUser.subscription?.status === 'ACTIVE'
                    ? 'نشط'
                    : selectedUser.subscription?.status === 'TRIALING'
                      ? 'تجريبي'
                      : selectedUser.subscription?.status === 'CANCELED'
                        ? 'ملغى'
                        : 'غير متوفر'}
                </span>
              </div>
            </div>

            <div className="border-t border-line pt-3">
              <h4 className="font-bold text-sm text-ink mb-2">القنوات المتصلة ({selectedUser.channels.length})</h4>
              {selectedUser.channels.length === 0 ? (
                <p className="text-xs text-ink-mute">لا توجد قنوات يوتيوب متصلة.</p>
              ) : (
                <div className="space-y-2">
                  {selectedUser.channels.map((ch) => (
                    <div key={ch.id} className="p-2.5 rounded-lg bg-paper border border-line flex justify-between text-xs">
                      <span className="font-bold">{ch.title}</span>
                      <span className="text-ink-mute">{ch.subscriberCount.toLocaleString('ar')} مشترك</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* إجراءات: تحذير + منح خطة مجانية */}
            <div className="border-t border-line pt-3 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-ink mb-2">⚠️ إرسال تحذير</h4>
                <div className="flex gap-2">
                  <input
                    value={warnMessage}
                    onChange={(e) => setWarnMessage(e.target.value)}
                    placeholder="نص التحذير للمستخدم..."
                    className="flex-1 h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={warnSending || !warnMessage.trim()}
                    onClick={async () => {
                      setWarnSending(true);
                      try {
                        const r = await fetch(`/api/admin/users/${selectedUser.id}/warn`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message: warnMessage }),
                        });
                        const d = await r.json();
                        setToast(d.ok ? 'تم إرسال التحذير.' : d.error || 'تعذّر الإرسال.');
                        if (d.ok) setWarnMessage('');
                      } finally {
                        setWarnSending(false);
                        setTimeout(() => setToast(null), 3000);
                      }
                    }}
                  >
                    {warnSending ? '...' : 'إرسال'}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-ink mb-2">🎁 منح خطة مجانية</h4>
                <div className="flex gap-2 items-center">
                  <select
                    value={freePlanId}
                    onChange={(e) => setFreePlanId(e.target.value)}
                    className="h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
                  >
                    <option value="starter">أساسي</option>
                    <option value="growth">نمو</option>
                    <option value="agency">وكالة</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={freeDuration}
                    onChange={(e) => setFreeDuration(e.target.value)}
                    placeholder="المدة بالأيام"
                    className="w-24 h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
                  />
                  <span className="text-xs text-ink-mute">يوم</span>
                  <Button
                    variant="green"
                    size="sm"
                    disabled={freeSending}
                    onClick={async () => {
                      setFreeSending(true);
                      try {
                        const r = await fetch(`/api/admin/users/${selectedUser.id}/offer`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId: freePlanId, durationDays: Number(freeDuration) || 30 }),
                        });
                        const d = await r.json();
                        setToast(d.ok ? 'تم منح الخطة المجانية.' : d.error || 'تعذّر المنح.');
                        if (d.ok) fetchUsers(search);
                      } finally {
                        setFreeSending(false);
                        setTimeout(() => setToast(null), 3000);
                      }
                    }}
                  >
                    {freeSending ? '...' : 'منح مجانًا'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-3 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Suspend / Reactivate */}
      {selectedUser && modalAction && (
        <Modal
          open={true}
          onClose={() => {
            setModalAction(null);
            setSelectedUser(null);
          }}
          title={
            modalAction === 'suspend'
              ? 'تأكيد إيقاف الحساب'
              : 'تأكيد إعادة تفعيل الحساب'
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              {modalAction === 'suspend'
                ? `هل أنت متأكد تريد إيقاف حساب ${selectedUser.email}؟ سيُمنع المستخدم من الوصول إلى لوحة العميل حتى إعادة التفعيل. سيُسجَّل هذا الإجراء في سجل التدقيق.`
                : `إعادة تفعيل حساب ${selectedUser.email}؟ ستُستعاد فورًا إمكانية الوصول إلى لوحة العميل.`}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
              >
                إلغاء
              </Button>

              <Button
                variant={modalAction === 'suspend' ? 'danger' : 'green'}
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'جارٍ المعالجة...' : modalAction === 'suspend' ? 'تأكيد الإيقاف' : 'تأكيد إعادة التفعيل'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
