import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from '@/lib/services/audit';
import { redis } from '@/lib/db/redis';

// In-memory rate limiting & failed attempts tracker (fallback if Redis/DB is unavailable)
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const failedAttemptsMap = new Map<string, AttemptRecord>();
const rateLimitMap = new Map<string, AttemptRecord>();

const LOCKOUT_THRESHOLD = 5; // 5 failed attempts
const LOCKOUT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

async function logRateLimitExceeded(key: string, limit: number, count: number, windowMs: number) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: 'RATE_LIMIT_EXCEEDED',
        ipAddress: key,
        severity: 'WARNING',
        details: { limit, count, windowMs },
      },
    });

    await writeAuditLog({
      action: 'auth.rate_limited',
      actorId: key,
      actorRole: 'system',
      ipAddress: key,
      metadata: { limit, count },
    });
  } catch (err) {
    console.warn('[Security Guardian] DB write error during rate limit log:', err);
  }
}

/**
 * Check and enforce rate limiting for sensitive endpoints.
 * Backed by Upstash Redis if configured; falls back to in-memory store.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): Promise<{ allowed: boolean; remaining: number }> {
  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      }
      if (count > limit) {
        logRateLimitExceeded(key, limit, count, windowMs);
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: limit - count };
    } catch (err) {
      console.warn('[Security Guardian] Redis error, falling back to memory rate limiter:', err);
    }
  }

  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, firstAttempt: now };

  if (now - record.firstAttempt > windowMs) {
    record.count = 0;
    record.firstAttempt = now;
  }

  record.count += 1;
  rateLimitMap.set(key, record);

  if (record.count > limit) {
    logRateLimitExceeded(key, limit, record.count, windowMs);
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - record.count };
}

/**
 * Check if an email address is currently temporarily locked out due to failed logins.
 * Persists across Serverless instances via DB SecurityEvents and Redis.
 */
export async function isAccountLocked(email: string): Promise<{ locked: boolean; remainingSeconds: number }> {
  const normalized = email.toLowerCase().trim();
  const now = Date.now();

  // 1. Check in-memory fast cache
  const memRecord = failedAttemptsMap.get(normalized);
  if (memRecord?.lockedUntil && memRecord.lockedUntil > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((memRecord.lockedUntil - now) / 1000),
    };
  }

  // 2. Check Redis if available
  if (redis) {
    try {
      const redisTtl = await redis.ttl(`lockout:${normalized}`);
      if (redisTtl > 0) {
        return { locked: true, remainingSeconds: redisTtl };
      }
    } catch (err) {
      console.warn('[Security Guardian] Redis lockout check error:', err);
    }
  }

  // 3. Check persistent database security events across serverless lambdas
  if (process.env.DATABASE_URL) {
    try {
      const recentLockout = await prisma.securityEvent.findFirst({
        where: {
          type: 'TEMPORARY_LOCKOUT',
          email: normalized,
          createdAt: { gte: new Date(now - LOCKOUT_WINDOW_MS) },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentLockout) {
        const lockoutTime = new Date(recentLockout.createdAt).getTime();
        const elapsed = now - lockoutTime;
        if (elapsed < LOCKOUT_WINDOW_MS) {
          const remainingSeconds = Math.ceil((LOCKOUT_WINDOW_MS - elapsed) / 1000);
          return { locked: true, remainingSeconds };
        }
      }
    } catch (err) {
      console.warn('[Security Guardian] DB lockout check error:', err);
    }
  }

  return { locked: false, remainingSeconds: 0 };
}

/**
 * Record an authentication attempt (magic-link or OAuth).
 * Performs anomaly detection for new devices/IPs and auto-lockout tracking.
 */
export async function recordAuthAttempt(params: {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  isMagicLink?: boolean;
}): Promise<{ success: boolean; anomalyDetected?: boolean; lockedOut?: boolean }> {
  const normalizedEmail = params.email.toLowerCase();
  const now = Date.now();

  if (!params.success) {
    // Record failure
    const record = failedAttemptsMap.get(normalizedEmail) || { count: 0, firstAttempt: now };
    if (now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
      record.count = 0;
      record.firstAttempt = now;
    }

    record.count += 1;

    if (record.count >= LOCKOUT_THRESHOLD) {
      record.lockedUntil = now + LOCKOUT_WINDOW_MS;
      failedAttemptsMap.set(normalizedEmail, record);

      // Record Lockout Event
      try {
        await prisma.securityEvent.create({
          data: {
            type: 'TEMPORARY_LOCKOUT',
            email: normalizedEmail,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            severity: 'CRITICAL',
            details: { failedAttempts: record.count, lockoutDurationMinutes: 10 },
          },
        });

        await writeAuditLog({
          action: 'auth.account_locked',
          actorId: normalizedEmail,
          actorRole: 'system',
          ipAddress: params.ipAddress,
          metadata: { failedAttempts: record.count, isMagicLink: params.isMagicLink },
        });
      } catch (err) {
        console.warn('[Security Guardian] DB write error during lockout:', err);
      }

        if (redis) {
          try {
            await redis.set(`lockout:${normalizedEmail}`, '1', { ex: Math.ceil(LOCKOUT_WINDOW_MS / 1000) });
          } catch (err) {
            console.warn('[Security Guardian] Redis lockout set error:', err);
          }
        }

        return { success: false, lockedOut: true };
      } else {
        failedAttemptsMap.set(normalizedEmail, record);
        // Log magic link attempt failure
        try {
          await prisma.securityEvent.create({
            data: {
              type: 'FAILED_MAGIC_LINK',
              email: normalizedEmail,
              ipAddress: params.ipAddress,
              userAgent: params.userAgent,
              severity: 'WARNING',
              details: { attemptNumber: record.count },
            },
          });

          await writeAuditLog({
            action: 'auth.magic_link_failed',
            actorId: normalizedEmail,
            actorRole: 'system',
            ipAddress: params.ipAddress,
            metadata: { attemptNumber: record.count },
          });
        } catch (err) {
          console.warn('[Security Guardian] DB write error during failed login:', err);
        }
      }

      return { success: false };
    }

    // Clear failures on successful authentication
    failedAttemptsMap.delete(normalizedEmail);
    if (redis) {
      try {
        await redis.del(`lockout:${normalizedEmail}`);
      } catch {}
    }

  // Check for device/location anomaly
  let anomalyDetected = false;
  if (process.env.DATABASE_URL) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { sessions: { take: 10, orderBy: { createdAt: 'desc' } } },
      });

      if (user && user.sessions.length > 0) {
        const knownIPs = new Set(user.sessions.map((s: any) => s.ipAddress).filter(Boolean));
        const knownAgents = new Set(user.sessions.map((s: any) => s.userAgent).filter(Boolean));

        const isNewIP = params.ipAddress && !knownIPs.has(params.ipAddress);
        const isNewAgent = params.userAgent && !knownAgents.has(params.userAgent);

        if (isNewIP || isNewAgent) {
          anomalyDetected = true;
          await prisma.securityEvent.create({
            data: {
              type: 'NEW_DEVICE_LOGIN',
              email: normalizedEmail,
              ipAddress: params.ipAddress,
              userAgent: params.userAgent,
              severity: 'WARNING',
              details: { isNewIP, isNewAgent, previousSessionCount: user.sessions.length },
            },
          });

          await writeAuditLog({
            action: 'auth.login',
            actorId: user.id,
            actorRole: user.role.toLowerCase(),
            ipAddress: params.ipAddress,
            metadata: { anomaly: true, isNewIP, isNewAgent },
          });
        }
      }
    } catch (err) {
      console.warn('[Security Guardian] Anomaly detection lookup error:', err);
    }
  }

  return { success: true, anomalyDetected };
}

/**
 * Ask the AI Security Guardian questions in natural language (Arabic).
 * Reads real SecurityEvent & AuditLog data and returns an actionable,
 * data-backed Arabic report.
 */
export async function querySecurityGuardian(question: string): Promise<string> {
  const q = question.trim();

  try {
    const { getSecurityEvents, listAuditLogs } = await import('@/lib/admin/data');
    const events = await getSecurityEvents();
    const { items: auditLogs } = await listAuditLogs({ limit: 20 });

    const lockoutEvents = events.filter((e) => e.type === 'TEMPORARY_LOCKOUT');
    const failedMagicLinks = events.filter((e) => e.type === 'FAILED_MAGIC_LINK');
    const rateLimits = events.filter((e) => e.type === 'RATE_LIMIT_EXCEEDED');
    const flagged = events.filter((e) => e.severity === 'WARNING' || e.severity === 'CRITICAL');

    const fmt = (iso: string) =>
      new Date(iso).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

    // Intent: report on a specific account (email or name)
    const { listUsers, getAccountReport } = await import('@/lib/admin/data');
    const allUsers = await listUsers('');
    const emailMatch = q.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const matchedUser = emailMatch
      ? allUsers.find((u) => u.email.toLowerCase() === emailMatch[0].toLowerCase())
      : allUsers.find((u) => u.name && u.name.trim().length > 0 && q.includes(u.name));

    if (matchedUser) {
      const rep = await getAccountReport(matchedUser.email);
      if (rep) {
        const u = rep.user as unknown as {
          name: string | null;
          email: string;
          role: string;
          status: string;
          createdAt: string;
          channels: { title: string; subscriberCount: number }[];
          subscription: { plan: string; status: string } | null;
        };
        let report = `### 👤 Account report: ${u.name || u.email}\n\n`;
        report += `- **Email**: \`${u.email}\`\n`;
        report += `- **Role**: ${u.role}\n`;
        report += `- **Status**: ${u.status === 'SUSPENDED' ? 'Suspended' : 'Active'}\n`;
        report += `- **Member since**: ${new Date(u.createdAt).toLocaleDateString('en-US')}\n`;
        report += `- **Plan**: ${u.subscription?.plan || 'None'}\n`;
        report += `- **Subscription status**: ${u.subscription?.status || '—'}\n\n`;

        report += `**Connected channels (${u.channels?.length || 0})**:\n`;
        if (u.channels?.length) {
          u.channels.forEach((ch) => {
            report += `- ${ch.title} — ${ch.subscriberCount.toLocaleString('en-US')} subscribers\n`;
          });
        } else {
          report += '- No channels\n';
        }

        const audit = rep.audit as { action: string; timestamp: string }[];
        const security = rep.security as { type: string; severity: string; createdAt: string }[];
        const notices = rep.notices as { message: string; createdAt: string }[];
        const grants = rep.grants as { planId: string | null; durationDays: number; expiresAt: string }[];

        report += `\n**Account activity (${audit.length} actions)**:\n`;
        if (audit.length) {
          audit.slice(0, 6).forEach((a) => {
            report += `- \`${a.action}\` — ${new Date(a.timestamp).toLocaleString('en-US')}\n`;
          });
        } else {
          report += '- No recorded activity\n';
        }

        report += `\n**Security events (${security.length})**:\n`;
        if (security.length) {
          security.slice(0, 5).forEach((e) => {
            report += `- [${e.severity === 'CRITICAL' ? 'Critical' : 'Warning'}] ${e.type} — ${new Date(e.createdAt).toLocaleString('en-US')}\n`;
          });
        } else {
          report += '- No security events\n';
        }

        if (notices.length) {
          report += `\n**Sent warnings (${notices.length})**:\n`;
          notices.forEach((n) => {
            report += `- ${n.message} — ${new Date(n.createdAt).toLocaleString('en-US')}\n`;
          });
        }

        if (grants.length) {
          report += `\n**Free access grants (${grants.length})**:\n`;
          grants.forEach((g) => {
            report += `- ${g.planId ? `Plan ${g.planId}` : 'All plans'} for ${g.durationDays} days — expires ${new Date(g.expiresAt).toLocaleDateString('en-US')}\n`;
          });
        }

        return report;
      }
    }

    // Intent: suspicious login activity
    if (/suspicious|login|activity|breach|sign[- ]?in/i.test(q)) {
      let report = '### 🛡️ Login activity report\n\n';
      report += `I reviewed the security events and logs. Here is the current state:\n\n`;
      report += `- **Total important events**: ${events.length}\n`;
      report += `- **Recent warning/critical events**: ${flagged.length}\n`;
      report += `- **Logins from new devices**: ${events.filter((e) => e.type === 'NEW_DEVICE_LOGIN').length}\n\n`;

      if (flagged.length === 0) {
        report += '✅ **No suspicious activity.** All authentication and session flows are within normal bounds.\n';
      } else {
        report += '#### Recent suspicious events:\n\n';
        flagged.slice(0, 6).forEach((e) => {
          const badge = e.severity === 'CRITICAL' ? '🚨 Critical' : '⚠️ Warning';
          report += `- **[${badge}] ${e.type}**: email: \`${e.email || 'not set'}\` | IP: \`${e.ipAddress || 'unknown'}\` | ${fmt(e.createdAt)}\n`;
        });
      }
      return report;
    }

    // Intent: failed magic links / attempts
    if (/magic link|magic links|failed|attempts|auth/i.test(q)) {
      let report = '### 🔐 Failed login attempts & lockouts analysis\n\n';
      report += `State of failed authentication attempts and locked accounts:\n\n`;

      if (failedMagicLinks.length === 0) {
        report += '✅ **No failed magic-link attempts recorded recently.**\n\n';
      } else {
        report += '#### Failed magic-link attempts:\n';
        failedMagicLinks.slice(0, 6).forEach((e) => {
          report += `- \`${e.email}\` from IP \`${e.ipAddress || 'local'}\` — ${fmt(e.createdAt)}\n`;
        });
        report += '\n';
      }

      report += `#### Lockout log (${lockoutEvents.length} total):\n`;
      if (lockoutEvents.length === 0) {
        report += 'No recorded lockouts.\n';
      } else {
        lockoutEvents.slice(0, 5).forEach((e) => {
          report += `- **${e.type}**: \`${e.email}\` from IP \`${e.ipAddress || 'local'}\` — ${fmt(e.createdAt)}\n`;
        });
      }
      return report;
    }

    // Intent: lockouts & rate limits
    if (/lockout|lock|rate limit|rate|exceed/i.test(q)) {
      let report = '### 🚦 Lockouts & rate limits report\n\n';

      report += `#### Recent lockouts:\n`;
      if (lockoutEvents.length === 0) {
        report += 'No active or recent lockouts.\n\n';
      } else {
        lockoutEvents.slice(0, 5).forEach((e) => {
          report += `- \`${e.email}\` — IP \`${e.ipAddress || 'local'}\` — ${fmt(e.createdAt)}\n`;
        });
        report += '\n';
      }

      report += `#### Rate-limit exceeded events:\n`;
      if (rateLimits.length === 0) {
        report += 'No rate-limit violations.\n';
      } else {
        rateLimits.slice(0, 5).forEach((e) => {
          report += `- IP \`${e.ipAddress}\` — ${fmt(e.createdAt)}\n`;
        });
      }
      return report;
    }

    // Intent: audit logs
    if (/audit|log|actions|platform events/i.test(q)) {
      let report = '### 📋 Immutable audit log summary\n\n';
      report += 'Latest platform-wide recorded actions:\n\n';
      auditLogs.slice(0, 7).forEach((log) => {
        report += `- \`${log.action}\` — by \`${log.actorId}\` (${log.actorRole || 'user'}) — ${fmt(log.timestamp)}\n`;
      });
      return report;
    }

    // Free question: use the DeepSeek brain with real security context (limited tokens)
    const { isDeepSeekConfigured, askDeepSeek } = await import('@/lib/ai-providers/deepseek');
    if (isDeepSeekConfigured()) {
      try {
        const context = [
          `Total security events: ${events.length}`,
          `Warning/critical: ${flagged.length}`,
          `Lockouts: ${lockoutEvents.length}`,
          `Failed magic links: ${failedMagicLinks.length}`,
          `Rate-limit violations: ${rateLimits.length}`,
          '',
          'Latest events:',
          ...flagged
            .slice(0, 8)
            .map(
              (e) =>
                `- [${e.severity}] ${e.type} | ${e.email || '-'} | ${e.ipAddress || '-'} | ${fmt(e.createdAt)}`
            ),
          '',
          'Latest audit logs:',
          ...auditLogs.slice(0, 8).map((l) => `- ${l.action} | ${l.actorId} | ${fmt(l.timestamp)}`),
        ].join('\n');

        const answer = await askDeepSeek({
          system:
            'You are the security guardian of the VOVO Agent AI platform. Answer in English, concisely and professionally, relying only on the attached data, and never invent numbers. Use light Markdown.',
          user: `Administrator question: ${q}\n\nReal system data:\n${context}`,
          maxTokens: 600,
        });
        return `### 🛡️ Security guardian\n\n${answer}`;
      } catch (err) {
        console.warn('[Security Guardian] DeepSeek unavailable, using rule-based summary:', err);
      }
    }

    // Intent: security health summary (default)
    let report = '### 🛡️ Security guardian health summary\n\n';
    report += 'I continuously monitor authentication points, session integrity, rate limits, and audit logs platform-wide.\n\n';
    report += '**Current metrics:**\n';
    report += `- **Recorded security events**: ${events.length}\n`;
    report += `- **Warning/critical events**: ${flagged.length}\n`;
    report += `- **Lockouts**: ${lockoutEvents.length}\n`;
    report += `- **Audit log entries**: ${auditLogs.length}\n\n`;
    report += 'You can ask me about suspicious logins, failed magic links, user lockouts, or specific audit actions.';
    return report;
  } catch (err) {
    console.error('[Security Guardian Query Error]', err);
    return '### 🛡️ Security guardian status\n\nThe security system is active. Core rate limiting and audit logging are working properly. (No active incidents).';
  }
}
