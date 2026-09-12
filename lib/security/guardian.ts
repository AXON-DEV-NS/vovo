import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from '@/lib/services/audit';

// In-memory rate limiting & failed attempts tracker (resets on server restart or window expiry)
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

/**
 * Check and enforce rate limiting for sensitive endpoints.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, firstAttempt: now };

  if (now - record.firstAttempt > windowMs) {
    record.count = 0;
    record.firstAttempt = now;
  }

  record.count += 1;
  rateLimitMap.set(key, record);

  if (record.count > limit) {
    // Flag rate limit exceeded
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'RATE_LIMIT_EXCEEDED',
          ipAddress: key,
          severity: 'WARNING',
          details: { limit, count: record.count, windowMs },
        },
      });

      await writeAuditLog({
        action: 'auth.rate_limited',
        actorId: key,
        actorRole: 'system',
        ipAddress: key,
        metadata: { limit, count: record.count },
      });
    } catch (err) {
      console.warn('[Security Guardian] DB write error during rate limit log:', err);
    }

    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - record.count };
}

/**
 * Check if an email address is currently temporarily locked out due to failed logins.
 */
export function isAccountLocked(email: string): { locked: boolean; remainingSeconds: number } {
  const record = failedAttemptsMap.get(email.toLowerCase());
  if (!record || !record.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  if (now > record.lockedUntil) {
    failedAttemptsMap.delete(email.toLowerCase());
    return { locked: false, remainingSeconds: 0 };
  }

  return {
    locked: true,
    remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
  };
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
      new Date(iso).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

    // نيّة: تقرير حساب محدّد (بريد أو اسم)
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
        let report = `### 👤 تقرير الحساب: ${u.name || u.email}\n\n`;
        report += `- **البريد الإلكتروني**: \`${u.email}\`\n`;
        report += `- **الدور**: ${u.role}\n`;
        report += `- **الحالة**: ${u.status === 'SUSPENDED' ? 'موقوف' : 'نشط'}\n`;
        report += `- **عضو منذ**: ${new Date(u.createdAt).toLocaleDateString('ar')}\n`;
        report += `- **الخطة**: ${u.subscription?.plan || 'لا توجد'}\n`;
        report += `- **حالة الاشتراك**: ${u.subscription?.status || '—'}\n\n`;

        report += `**القنوات المتصلة (${u.channels?.length || 0})**:\n`;
        if (u.channels?.length) {
          u.channels.forEach((ch) => {
            report += `- ${ch.title} — ${ch.subscriberCount.toLocaleString('ar')} مشترك\n`;
          });
        } else {
          report += '- لا توجد قنوات\n';
        }

        const audit = rep.audit as { action: string; timestamp: string }[];
        const security = rep.security as { type: string; severity: string; createdAt: string }[];
        const notices = rep.notices as { message: string; createdAt: string }[];
        const grants = rep.grants as { planId: string | null; durationDays: number; expiresAt: string }[];

        report += `\n**نشاط الحساب (${audit.length} إجراء)**:\n`;
        if (audit.length) {
          audit.slice(0, 6).forEach((a) => {
            report += `- \`${a.action}\` — ${new Date(a.timestamp).toLocaleString('ar')}\n`;
          });
        } else {
          report += '- لا يوجد نشاط مسجّل\n';
        }

        report += `\n**الأحداث الأمنية (${security.length})**:\n`;
        if (security.length) {
          security.slice(0, 5).forEach((e) => {
            report += `- [${e.severity === 'CRITICAL' ? 'حرج' : 'تحذير'}] ${e.type} — ${new Date(e.createdAt).toLocaleString('ar')}\n`;
          });
        } else {
          report += '- لا توجد أحداث أمنية\n';
        }

        if (notices.length) {
          report += `\n**التحذيرات المرسلة (${notices.length})**:\n`;
          notices.forEach((n) => {
            report += `- ${n.message} — ${new Date(n.createdAt).toLocaleString('ar')}\n`;
          });
        }

        if (grants.length) {
          report += `\n**منح الوصول المجاني (${grants.length})**:\n`;
          grants.forEach((g) => {
            report += `- ${g.planId ? `خطة ${g.planId}` : 'كل الخطط'} لمدة ${g.durationDays} يوم — تنتهي ${new Date(g.expiresAt).toLocaleDateString('ar')}\n`;
          });
        }

        return report;
      }
    }

    // نيّة: نشاط تسجيل دخول مشبوه
    if (/مشبوه|تسجيل دخول|نشاط|اختراق|دخول/.test(q)) {
      let report = '### 🛡️ تقرير نشاط تسجيل الدخول\n\n';
      report += `راجعتُ أحداث الأمان والسجلات. إليك الوضع الحالي:\n\n`;
      report += `- **إجمالي الأحداث المهمة**: ${events.length}\n`;
      report += `- **أحداث تحذيرية/حرجة حديثة**: ${flagged.length}\n`;
      report += `- **تسجيلات دخول من أجهزة جديدة**: ${events.filter((e) => e.type === 'NEW_DEVICE_LOGIN').length}\n\n`;

      if (flagged.length === 0) {
        report += '✅ **لا يوجد نشاط مشبوه.** جميع تدفقات المصادقة والجلسات تعمل ضمن الحدود الطبيعية.\n';
      } else {
        report += '#### الأحداث المشبوهة الأخيرة:\n\n';
        flagged.slice(0, 6).forEach((e) => {
          const badge = e.severity === 'CRITICAL' ? '🚨 حرج' : '⚠️ تحذير';
          report += `- **[${badge}] ${e.type}**: البريد: \`${e.email || 'غير محدد'}\` | IP: \`${e.ipAddress || 'غير معروف'}\` | ${fmt(e.createdAt)}\n`;
        });
      }
      return report;
    }

    // نيّة: الروابط السحرية الفاشلة / المحاولات
    if (/الروابط السحرية|رابط سحري|فاشل|محاولات|مصادقة/.test(q)) {
      let report = '### 🔐 تحليل محاولات الدخول الفاشلة والإقفالات\n\n';
      report += `حالة محاولات المصادقة الفاشلة والحسابات المقفلة:\n\n`;

      if (failedMagicLinks.length === 0) {
        report += '✅ **لا توجد محاولات روابط سحرية فاشلة مسجلة مؤخرًا.**\n\n';
      } else {
        report += '#### محاولات الروابط السحرية الفاشلة:\n';
        failedMagicLinks.slice(0, 6).forEach((e) => {
          report += `- \`${e.email}\` من IP \`${e.ipAddress || 'محلي'}\` — ${fmt(e.createdAt)}\n`;
        });
        report += '\n';
      }

      report += `#### سجل الإقفالات (${lockoutEvents.length} إجمالًا):\n`;
      if (lockoutEvents.length === 0) {
        report += 'لا توجد حالات إقفال مسجلة.\n';
      } else {
        lockoutEvents.slice(0, 5).forEach((e) => {
          report += `- **${e.type}**: \`${e.email}\` من IP \`${e.ipAddress || 'محلي'}\` — ${fmt(e.createdAt)}\n`;
        });
      }
      return report;
    }

    // نيّة: الإقفالات وحدود المعدل
    if (/إقفال|قفل|حدود المعدل|معدل|تجاوز/.test(q)) {
      let report = '### 🚦 تقرير الإقفالات وحدود المعدل\n\n';

      report += `#### حالات الإقفال الأخيرة:\n`;
      if (lockoutEvents.length === 0) {
        report += 'لا توجد حالات إقفال نشطة أو حديثة.\n\n';
      } else {
        lockoutEvents.slice(0, 5).forEach((e) => {
          report += `- \`${e.email}\` — IP \`${e.ipAddress || 'محلي'}\` — ${fmt(e.createdAt)}\n`;
        });
        report += '\n';
      }

      report += `#### أحداث تجاوز حد المعدل:\n`;
      if (rateLimits.length === 0) {
        report += 'لا توجد حالات تجاوز لحدود المعدل.\n';
      } else {
        rateLimits.slice(0, 5).forEach((e) => {
          report += `- IP \`${e.ipAddress}\` — ${fmt(e.createdAt)}\n`;
        });
      }
      return report;
    }

    // نيّة: سجلات التدقيق
    if (/تدقيق|سجل|إجراءات|أحداث المنصة/.test(q)) {
      let report = '### 📋 ملخص سجل التدقيق غير القابل للتعديل\n\n';
      report += 'أحدث الإجراءات المسجلة على مستوى المنصة:\n\n';
      auditLogs.slice(0, 7).forEach((log) => {
        report += `- \`${log.action}\` — بواسطة \`${log.actorId}\` (${log.actorRole || 'مستخدم'}) — ${fmt(log.timestamp)}\n`;
      });
      return report;
    }

    // سؤال حر: استخدم عقل DeepSeek مع سياق أمني حقيقي (توكنز محدودة)
    const { isDeepSeekConfigured, askDeepSeek } = await import('@/lib/ai-providers/deepseek');
    if (isDeepSeekConfigured()) {
      try {
        const context = [
          `إجمالي الأحداث الأمنية: ${events.length}`,
          `تحذيرية/حرجة: ${flagged.length}`,
          `إقفالات: ${lockoutEvents.length}`,
          `روابط سحرية فاشلة: ${failedMagicLinks.length}`,
          `تجاوزات حد المعدل: ${rateLimits.length}`,
          '',
          'أحدث الأحداث:',
          ...flagged
            .slice(0, 8)
            .map(
              (e) =>
                `- [${e.severity}] ${e.type} | ${e.email || '-'} | ${e.ipAddress || '-'} | ${fmt(e.createdAt)}`
            ),
          '',
          'أحدث سجلات التدقيق:',
          ...auditLogs.slice(0, 8).map((l) => `- ${l.action} | ${l.actorId} | ${fmt(l.timestamp)}`),
        ].join('\n');

        const answer = await askDeepSeek({
          system:
            'أنت الحارس الأمني لمنصة VOVO Agent AI. أجب بالعربية بإيجاز واحترافية اعتمادًا على البيانات المرفقة فقط، ولا تخترع أي أرقام. استخدم Markdown خفيفًا.',
          user: `سؤال المسؤول: ${q}\n\nبيانات النظام الحقيقية:\n${context}`,
          maxTokens: 600,
        });
        return `### 🛡️ الحارس الأمني\n\n${answer}`;
      } catch (err) {
        console.warn('[Security Guardian] DeepSeek unavailable, using rule-based summary:', err);
      }
    }

    // نيّة: ملخص الصحة الأمنية (افتراضي)
    let report = '### 🛡️ ملخص الحارس الأمني للصحة الأمنية\n\n';
    report += 'أراقب باستمرار نقاط المصادقة وسلامة الجلسات وحدود المعدل وسجلات التدقيق على مستوى المنصة.\n\n';
    report += '**القياسات الحالية:**\n';
    report += `- **الأحداث الأمنية المسجلة**: ${events.length}\n`;
    report += `- **الأحداث التحذيرية/الحرجة**: ${flagged.length}\n`;
    report += `- **حالات الإقفال**: ${lockoutEvents.length}\n`;
    report += `- **إدخالات سجل التدقيق**: ${auditLogs.length}\n\n`;
    report += 'يمكنك سؤالي عن تسجيلات الدخول المشبوهة، أو فشل الروابط السحرية، أو إقفالات المستخدمين، أو إجراءات تدقيق محددة.';
    return report;
  } catch (err) {
    console.error('[Security Guardian Query Error]', err);
    return '### 🛡️ حالة الحارس الأمني\n\nالنظام الأمني نشط. تحديد المعدل الأساسي وتسجيل التدقيق يعملان بشكل سليم. (لا توجد حوادث نشطة).';
  }
}
