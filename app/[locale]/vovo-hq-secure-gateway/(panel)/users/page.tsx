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
  STARTER: 'Starter',
  GROWTH: 'Growth',
  AGENCY: 'Agency',
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
            ? 'Account suspended successfully.'
            : 'Account reactivated successfully.')
      );
      fetchUsers(search);
      setModalAction(null);
      setSelectedUser(null);
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
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
            Close
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">User management — HQ</h1>
          <p className="text-sm text-ink-mute">
            Search users, inspect connected YouTube channels and subscriptions, and suspend/reactivate accounts.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-paper-high border-line shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              Search
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
                Clear
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
                <TableHead>User / email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    No users yet.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ink-mute">
                    No users match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-paper">
                    <TableCell>
                      <div>
                        <div className="font-semibold text-ink">{user.name || 'Unnamed user'}</div>
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
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Active
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
                          <span className="text-ink-faint">No connected channels</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-bold text-ink-soft">
                        {PLAN_LABELS[user.subscription?.plan || 'STARTER'] || user.subscription?.plan || 'Starter'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUser(user)}
                        >
                          View details
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
                            Reactivate
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
                            Suspend
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
          title={`User details — ${selectedUser.email}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-ink-mute block">Full name</span>
                <span className="font-semibold">{selectedUser.name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">Role</span>
                <span className="font-semibold">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">Account status</span>
                <span className="font-semibold">{selectedUser.status === 'ACTIVE' ? 'Active' : 'Suspended'}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">Member since</span>
                <span className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString('en-US')}</span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">Plan</span>
                <span className="font-semibold">
                  {PLAN_LABELS[selectedUser.subscription?.plan || 'STARTER'] || 'Starter'}
                </span>
              </div>
              <div>
                <span className="text-xs text-ink-mute block">Subscription status</span>
                <span className="font-semibold">
                  {selectedUser.subscription?.status === 'ACTIVE'
                    ? 'Active'
                    : selectedUser.subscription?.status === 'TRIALING'
                      ? 'Trial'
                      : selectedUser.subscription?.status === 'CANCELED'
                        ? 'Canceled'
                        : 'Not provided'}
                </span>
              </div>
            </div>

            <div className="border-t border-line pt-3">
              <h4 className="font-bold text-sm text-ink mb-2">Connected channels ({selectedUser.channels.length})</h4>
              {selectedUser.channels.length === 0 ? (
                <p className="text-xs text-ink-mute">No YouTube channels connected.</p>
              ) : (
                <div className="space-y-2">
                  {selectedUser.channels.map((ch) => (
                    <div key={ch.id} className="p-2.5 rounded-lg bg-paper border border-line flex justify-between text-xs">
                      <span className="font-bold">{ch.title}</span>
                      <span className="text-ink-mute">{ch.subscriberCount.toLocaleString('en-US')} subscribers</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: warning + free plan grant */}
            <div className="border-t border-line pt-3 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-ink mb-2">⚠️ Send a warning</h4>
                <div className="flex gap-2">
                  <input
                    value={warnMessage}
                    onChange={(e) => setWarnMessage(e.target.value)}
                    placeholder="Warning text for the user..."
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
                        setToast(d.ok ? 'Warning sent.' : d.error || 'Failed to send.');
                        if (d.ok) setWarnMessage('');
                      } finally {
                        setWarnSending(false);
                        setTimeout(() => setToast(null), 3000);
                      }
                    }}
                  >
                    {warnSending ? '...' : 'Send'}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-ink mb-2">🎁 Grant a free plan</h4>
                <div className="flex gap-2 items-center">
                  <select
                    value={freePlanId}
                    onChange={(e) => setFreePlanId(e.target.value)}
                    className="h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="agency">Agency</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={freeDuration}
                    onChange={(e) => setFreeDuration(e.target.value)}
                    placeholder="Duration in days"
                    className="w-24 h-10 rounded-md border border-line bg-paper-high px-3 text-sm"
                  />
                  <span className="text-xs text-ink-mute">days</span>
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
                        setToast(d.ok ? 'Free plan granted.' : d.error || 'Failed to grant.');
                        if (d.ok) fetchUsers(search);
                      } finally {
                        setFreeSending(false);
                        setTimeout(() => setToast(null), 3000);
                      }
                    }}
                  >
                    {freeSending ? '...' : 'Grant for free'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-3 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                Close
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
              ? 'Confirm account suspension'
              : 'Confirm account reactivation'
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              {modalAction === 'suspend'
                ? `Are you sure you want to suspend ${selectedUser.email}? The user will be blocked from the client dashboard until reactivated. This action will be recorded in the audit log.`
                : `Reactivate ${selectedUser.email}? Access to the client dashboard will be restored immediately.`}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setModalAction(null);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>

              <Button
                variant={modalAction === 'suspend' ? 'danger' : 'green'}
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : modalAction === 'suspend' ? 'Confirm suspension' : 'Confirm reactivation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
