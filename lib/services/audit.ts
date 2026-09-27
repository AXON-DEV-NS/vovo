/**
 * audit.ts — Centralized audit logging service.
 *
 * Provides a single `writeAuditLog()` function that every sensitive action in
 * the app must call. The AuditLog Prisma model is introduced in Phase 5
 * (Admin Panel). This module is structured so Phase 5 can wire the real DB
 * write in one place without touching any callers.
 *
 * Until Phase 5 migrations run, the function logs to the server console only.
 */

import { prisma } from '@/lib/db/prisma';

export type AuditAction =
  | 'auth.login'
  | 'auth.magic_link_failed'
  | 'auth.rate_limited'
  | 'auth.account_locked'
  | 'content.approved'
  | 'content.rejected'
  | 'content.changes_requested'
  | 'content.status_changed'
  | 'session.revoked'
  | 'account.deleted'
  | 'channel.disconnected'
  | 'ticket.created'
  | 'ticket.replied'
  | 'subscription.changed'
  | 'admin.login'
  | 'admin.user_suspended'
  | 'admin.user_reactivated';

export interface AuditEntry {
  action: AuditAction | string;
  /** The user whose data was affected */
  targetUserId?: string;
  /** The user or system actor who performed the action */
  actorId: string;
  actorRole?: 'admin' | 'client' | 'system' | string;
  /** Free-form metadata — keep it serializable */
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Write an audit log entry to the database and server console.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  console.info('[AUDIT]', JSON.stringify({ timestamp: new Date().toISOString(), ...entry }));

  if (!process.env.DATABASE_URL) {
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId,
        actorRole: entry.actorRole || 'client',
        targetUserId: entry.targetUserId || null,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
        ipAddress: entry.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to write audit log to database:', error);
  }
}

/**
 * Fetch audit logs for admin panel.
 */
export async function getAuditLogs(options?: {
  search?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  try {
    const where: any = {};
    if (options?.action) {
      where.action = options.action;
    }
    if (options?.search) {
      where.OR = [
        { action: { contains: options.search, mode: 'insensitive' } },
        { actorId: { contains: options.search, mode: 'insensitive' } },
        { targetUserId: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  } catch (error) {
    console.warn('[AUDIT READ WARN] Falling back to mock/empty audit logs:', error);
    return { items: [], total: 0 };
  }
}
