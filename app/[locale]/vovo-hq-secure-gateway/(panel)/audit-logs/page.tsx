'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface AuditLogItem {
  id: string;
  action: string;
  actorId: string;
  actorRole: string | null;
  targetUserId: string | null;
  metadata: any;
  ipAddress: string | null;
  timestamp: string;
}

const ACTION_LABELS: Record<string, string> = {
  'admin.login': 'دخول المدير',
  'admin.logout': 'خروج المدير',
  'admin.user_suspended': 'إيقاف مستخدم',
  'admin.user_reactivated': 'إعادة تفعيل مستخدم',
  'auth.login': 'تسجيل دخول',
  'auth.logout': 'تسجيل خروج',
  'auth.account_locked': 'إقفال حساب',
  'auth.magic_link': 'رابط سحري',
  'auth.rate_limited': 'تجاوز حد المعدل',
  'auth.failed_login': 'محاولة دخول فاشلة',
  'content.approved': 'اعتماد محتوى',
  'content.rejected': 'رفض محتوى',
  'content.published': 'نشر محتوى',
  'account.deleted': 'حذف حساب',
  'account.updated': 'تحديث حساب',
  'billing.subscribed': 'اشتراك',
  'billing.changed': 'تغيير الفوترة',
};

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin.login', label: 'دخول المدير' },
  { value: 'admin.user_suspended', label: 'إيقاف مستخدم' },
  { value: 'admin.user_reactivated', label: 'إعادة تفعيل مستخدم' },
  { value: 'auth.login', label: 'تسجيل دخول' },
  { value: 'auth.account_locked', label: 'إقفال حساب' },
  { value: 'content.approved', label: 'اعتماد محتوى' },
  { value: 'content.rejected', label: 'رفض محتوى' },
  { value: 'account.deleted', label: 'حذف حساب' },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = (q?: string, act?: string) => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (q) queryParams.set('q', q);
    if (act) queryParams.set('action', act);

    fetch(`/api/admin/audit-logs?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        setLogs(d.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch audit logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs('', '');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(search, actionFilter);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith('auth.')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (action.startsWith('admin.')) return 'bg-red-100 text-red-800 border-red-200';
    if (action.startsWith('content.')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.startsWith('account.')) return 'bg-green-50 text-green-700 border-green-100';
    return 'bg-paper-low text-ink-soft border-line';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">سجلات التدقيق غير القابلة للتعديل</h1>
          <p className="text-sm text-ink-mute">
            أثر منصة شامل للإجراءات الحساسة (أحداث المصادقة، إجراءات المدير، تغييرات الفوترة، حذف البيانات).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="ابحث بالإجراء أو معرّف الفاعل أو الهدف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                fetchLogs(search, e.target.value);
              }}
              className="px-3 py-2 border border-line-strong rounded-lg text-sm bg-paper-high text-ink-soft focus:outline-none focus:ring-2 focus:ring-ink"
            >
              <option value="">كل الإجراءات</option>
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button type="submit" variant="primary">
              تصفية
            </Button>

            {(search || actionFilter) && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setActionFilter('');
                  fetchLogs('', '');
                }}
              >
                إعادة تعيين
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>نوع الإجراء</TableHead>
                <TableHead>الفاعل</TableHead>
                <TableHead>المستخدم المستهدف</TableHead>
                <TableHead>عنوان IP</TableHead>
                <TableHead className="text-right">التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    جارٍ تحميل سجلات التدقيق...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    لا توجد سجلات تدقيق مطابقة لمعايير التصفية الحالية.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLog === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <TableRow className="hover:bg-paper">
                        <TableCell className="font-mono text-xs text-ink-soft whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('ar')}
                        </TableCell>

                        <TableCell>
                          <Badge variant="default" className={`font-mono text-xs ${getActionBadgeColor(log.action)}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs text-ink font-semibold" dir="ltr">{log.actorId}</span>
                          {log.actorRole && (
                            <span className="text-[10px] text-ink-faint block">
                              ({log.actorRole === 'admin' ? 'مدير' : log.actorRole === 'client' ? 'عميل' : log.actorRole})
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs text-ink-soft" dir="ltr">
                            {log.targetUserId || '—'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs text-ink-mute" dir="ltr">
                            {log.ipAddress || '127.0.0.1'}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                            className="text-xs"
                          >
                            {isExpanded ? 'إخفاء الحمولة' : 'عرض الحمولة'}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-ink text-paper-low">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-1 font-mono text-xs">
                              <div className="text-ink-faint font-semibold uppercase text-[10px] tracking-wider">
                                بيانات JSON الوصفية لسجل التدقيق
                              </div>
                              <pre className="bg-black/40 p-3 rounded-lg overflow-x-auto text-emerald-400">
                                {JSON.stringify(log.metadata || { note: 'لا توجد حمولة وصفية مرفقة' }, null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
