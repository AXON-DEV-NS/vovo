'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TableSkeletonRows } from '@/components/ui/page-skeletons';

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
  'admin.login': 'Admin login',
  'admin.logout': 'Admin logout',
  'admin.user_suspended': 'User suspended',
  'admin.user_reactivated': 'User reactivated',
  'auth.login': 'Sign-in',
  'auth.logout': 'Sign-out',
  'auth.account_locked': 'Account lockout',
  'auth.magic_link': 'Magic link',
  'auth.rate_limited': 'Rate limit exceeded',
  'auth.failed_login': 'Failed sign-in attempt',
  'content.approved': 'Content approved',
  'content.rejected': 'Content rejected',
  'content.published': 'Content published',
  'account.deleted': 'Account deleted',
  'account.updated': 'Account updated',
  'billing.subscribed': 'Subscribed',
  'billing.changed': 'Billing changed',
};

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin.login', label: 'Admin login' },
  { value: 'admin.user_suspended', label: 'User suspended' },
  { value: 'admin.user_reactivated', label: 'User reactivated' },
  { value: 'auth.login', label: 'Sign-in' },
  { value: 'auth.account_locked', label: 'Account lockout' },
  { value: 'content.approved', label: 'Content approved' },
  { value: 'content.rejected', label: 'Content rejected' },
  { value: 'account.deleted', label: 'Account deleted' },
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
          <h1 className="text-2xl font-bold text-ink">Immutable audit logs</h1>
          <p className="text-sm text-ink-mute">
            Platform-wide trail of sensitive actions (authentication events, admin actions, billing changes, data deletion).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Search by action, actor ID, or target..."
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
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button type="submit" variant="primary">
              Filter
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
                Reset
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
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target user</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows rows={8} columns={6} />
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    No audit logs match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLog === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <TableRow className="hover:bg-paper">
                        <TableCell className="font-mono text-xs text-ink-soft whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-US')}
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
                              ({log.actorRole === 'admin' ? 'admin' : log.actorRole === 'client' ? 'client' : log.actorRole})
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
                            {isExpanded ? 'Hide payload' : 'View payload'}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-ink text-paper-low">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-1 font-mono text-xs">
                              <div className="text-ink-faint font-semibold uppercase text-[10px] tracking-wider">
                                Audit log metadata JSON
                              </div>
                              <pre className="bg-black/40 p-3 rounded-lg overflow-x-auto text-emerald-400">
                                {JSON.stringify(log.metadata || { note: 'No metadata payload attached' }, null, 2)}
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
