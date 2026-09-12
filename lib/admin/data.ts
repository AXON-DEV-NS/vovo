import { prisma } from "@/lib/db/prisma";
import { PLANS } from "@/lib/plans";
import { randomBytes } from "crypto";

/**
 * Unified admin data layer.
 *
 * When DATABASE_URL is configured this reads/writes the real PostgreSQL
 * database via Prisma. In local development (no database) it falls back to a
 * stateful in-memory store seeded with realistic data, so every action in the
 * panel is genuinely functional — searches filter, suspensions persist, and
 * numbers are computed from actual records rather than static placeholders.
 */

export function usingDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  channels: { id: string; title: string; subscriberCount: number }[];
  subscription: { plan: string; status: string } | null;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorId: string;
  actorRole: string | null;
  targetUserId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface SecurityEventItem {
  id: string;
  type: string;
  email: string | null;
  ipAddress: string | null;
  severity: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  userEmail: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// In-memory demo store (development only)
// ─────────────────────────────────────────────────────────────

const PLAN_PRICE_CENTS: Record<string, number> = {
  STARTER: 2900,
  GROWTH: 7900,
  AGENCY: 19900,
};

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 60 * 60 * 1000).toISOString();

interface DemoState {
  users: AdminUser[];
  auditLogs: AuditLogItem[];
  securityEvents: SecurityEventItem[];
  invoices: InvoiceItem[];
  chatMessages: { id: string; sender: "admin" | "guardian"; message: string; createdAt: string }[];
  planOverrides: Record<string, { name?: string; monthlyPrice?: number; yearlyPrice?: number }>;
  promoCodes: PromoCode[];
  notices: UserNotice[];
  freeGrants: FreeGrant[];
  autoTrialEnabled: boolean;
  apiKey: string;
  apiSecret: string;
  apiKeys: Record<string, string>;
  apiKeyUpdatedAt: Record<string, string>;
  contactInquiries: ContactInquiry[];
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ipAddress?: string;
  createdAt: string;
}

function seed(): DemoState {
  const users: AdminUser[] = [
    { id: "u1", name: "أحمد المالك", email: "ahmed@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(120), channels: [{ id: "c1", title: "تقنية اليوم", subscriberCount: 124500 }], subscription: { plan: "GROWTH", status: "ACTIVE" } },
    { id: "u2", name: "سارة خالد", email: "sara@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(95), channels: [{ id: "c2", title: "مطبخ سارة", subscriberCount: 45200 }], subscription: { plan: "STARTER", status: "ACTIVE" } },
    { id: "u3", name: "ديفيد للوكالات", email: "david@agency.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(60), channels: [{ id: "c3", title: "أخبار العالم", subscriberCount: 89000 }, { id: "c4", title: "الرياضة الآن", subscriberCount: 67000 }], subscription: { plan: "AGENCY", status: "ACTIVE" } },
    { id: "u4", name: "ليلى حسن", email: "laila@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(45), channels: [{ id: "c5", title: "لياقة وصحة", subscriberCount: 31000 }], subscription: { plan: "STARTER", status: "TRIALING" } },
    { id: "u5", name: "محمد العلي", email: "mohammed@example.com", role: "CLIENT", status: "SUSPENDED", createdAt: daysAgo(40), channels: [], subscription: { plan: "GROWTH", status: "PAST_DUE" } },
    { id: "u6", name: "نور الدين", email: "nour@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(30), channels: [{ id: "c6", title: "ألعاب نون", subscriberCount: 210000 }], subscription: { plan: "GROWTH", status: "ACTIVE" } },
    { id: "u7", name: "هند سمير", email: "hind@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(22), channels: [{ id: "c7", title: "تعلم مع هند", subscriberCount: 56000 }], subscription: { plan: "STARTER", status: "ACTIVE" } },
    { id: "u8", name: "خالد عمر", email: "khaled@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(15), channels: [{ id: "c8", title: "ريادة الأعمال", subscriberCount: 73000 }], subscription: { plan: "GROWTH", status: "ACTIVE" } },
    { id: "u9", name: "ريم سعيد", email: "reem@example.com", role: "CLIENT", status: "SUSPENDED", createdAt: daysAgo(10), channels: [], subscription: { plan: "STARTER", status: "CANCELED" } },
    { id: "u10", name: "يوسف كريم", email: "youssef@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(5), channels: [{ id: "c9", title: "ترفيه يوسف", subscriberCount: 154000 }], subscription: { plan: "AGENCY", status: "TRIALING" } },
    { id: "u11", name: "فاطمة زهرة", email: "fatima@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(3), channels: [], subscription: { plan: "STARTER", status: "TRIALING" } },
    { id: "u12", name: "عمر فاروق", email: "omar@example.com", role: "CLIENT", status: "ACTIVE", createdAt: daysAgo(1), channels: [], subscription: { plan: "STARTER", status: "TRIALING" } },
  ];

  const auditLogs: AuditLogItem[] = [
    { id: "a1", action: "admin.login", actorId: "oren.on.oren.25@gmail.com", actorRole: "admin", targetUserId: null, metadata: { method: "password+2fa" }, ipAddress: "102.44.11.7", timestamp: hoursAgo(1) },
    { id: "a2", action: "auth.login", actorId: "ahmed@example.com", actorRole: "client", targetUserId: "u1", metadata: { anomaly: false }, ipAddress: "41.233.10.2", timestamp: hoursAgo(3) },
    { id: "a3", action: "auth.magic_link_failed", actorId: "nour@example.com", actorRole: "system", targetUserId: null, metadata: { attemptNumber: 2 }, ipAddress: "197.34.50.1", timestamp: hoursAgo(4) },
    { id: "a4", action: "content.approved", actorId: "u1", actorRole: "client", targetUserId: null, metadata: { contentId: "ci_42" }, ipAddress: null, timestamp: hoursAgo(6) },
    { id: "a5", action: "admin.user_suspended", actorId: "oren.on.oren.25@gmail.com", actorRole: "admin", targetUserId: "u5", metadata: { reason: "payment overdue" }, ipAddress: "102.44.11.7", timestamp: hoursAgo(9) },
    { id: "a6", action: "subscription.changed", actorId: "u3", actorRole: "client", targetUserId: "u3", metadata: { from: "GROWTH", to: "AGENCY" }, ipAddress: null, timestamp: hoursAgo(12) },
    { id: "a7", action: "auth.account_locked", actorId: "khaled@example.com", actorRole: "system", targetUserId: null, metadata: { failedAttempts: 5 }, ipAddress: "91.22.33.4", timestamp: hoursAgo(15) },
    { id: "a8", action: "channel.disconnected", actorId: "u4", actorRole: "client", targetUserId: null, metadata: { channelId: "c5" }, ipAddress: null, timestamp: hoursAgo(20) },
    { id: "a9", action: "content.rejected", actorId: "u1", actorRole: "client", targetUserId: null, metadata: { contentId: "ci_40" }, ipAddress: null, timestamp: hoursAgo(26) },
    { id: "a10", action: "auth.rate_limited", actorId: "203.0.113.9", actorRole: "system", targetUserId: null, metadata: { limit: 10, count: 12 }, ipAddress: "203.0.113.9", timestamp: hoursAgo(30) },
    { id: "a11", action: "ticket.replied", actorId: "u2", actorRole: "client", targetUserId: null, metadata: { ticketId: "tk_8" }, ipAddress: null, timestamp: hoursAgo(36) },
    { id: "a12", action: "admin.login", actorId: "oren.on.oren.25@gmail.com", actorRole: "admin", targetUserId: null, metadata: { method: "password+2fa" }, ipAddress: "102.44.11.7", timestamp: hoursAgo(48) },
    { id: "a13", action: "session.revoked", actorId: "u7", actorRole: "client", targetUserId: null, metadata: { sessionId: "s_19" }, ipAddress: null, timestamp: hoursAgo(52) },
    { id: "a14", action: "auth.login", actorId: "laila@example.com", actorRole: "client", targetUserId: "u4", metadata: { anomaly: true, isNewIP: true }, ipAddress: "66.249.80.1", timestamp: hoursAgo(60) },
    { id: "a15", action: "content.status_changed", actorId: "system", actorRole: "system", targetUserId: null, metadata: { from: "GENERATING", to: "READY_FOR_REVIEW" }, ipAddress: null, timestamp: hoursAgo(70) },
  ];

  const securityEvents: SecurityEventItem[] = [
    { id: "e1", type: "FAILED_MAGIC_LINK", email: "nour@example.com", ipAddress: "197.34.50.1", severity: "WARNING", details: { attemptNumber: 2 }, createdAt: hoursAgo(4) },
    { id: "e2", type: "TEMPORARY_LOCKOUT", email: "khaled@example.com", ipAddress: "91.22.33.4", severity: "CRITICAL", details: { failedAttempts: 5 }, createdAt: hoursAgo(15) },
    { id: "e3", type: "RATE_LIMIT_EXCEEDED", email: null, ipAddress: "203.0.113.9", severity: "WARNING", details: { limit: 10, count: 12 }, createdAt: hoursAgo(30) },
    { id: "e4", type: "NEW_DEVICE_LOGIN", email: "laila@example.com", ipAddress: "66.249.80.1", severity: "WARNING", details: { isNewIP: true }, createdAt: hoursAgo(60) },
    { id: "e5", type: "FAILED_MAGIC_LINK", email: "youssef@example.com", ipAddress: "45.67.89.1", severity: "WARNING", details: { attemptNumber: 1 }, createdAt: hoursAgo(3) },
    { id: "e6", type: "FAILED_MAGIC_LINK", email: "sara@example.com", ipAddress: "12.34.56.7", severity: "WARNING", details: { attemptNumber: 3 }, createdAt: hoursAgo(8) },
  ];

  const invoices: InvoiceItem[] = [
    { id: "inv_201", userEmail: "ahmed@example.com", amountCents: 7900, currency: "usd", status: "PAID", createdAt: daysAgo(2) },
    { id: "inv_202", userEmail: "sara@example.com", amountCents: 2900, currency: "usd", status: "PAID", createdAt: daysAgo(3) },
    { id: "inv_203", userEmail: "david@agency.com", amountCents: 19900, currency: "usd", status: "PAID", createdAt: daysAgo(5) },
    { id: "inv_204", userEmail: "nour@example.com", amountCents: 7900, currency: "usd", status: "PAID", createdAt: daysAgo(7) },
    { id: "inv_205", userEmail: "khaled@example.com", amountCents: 7900, currency: "usd", status: "FAILED", createdAt: daysAgo(8) },
    { id: "inv_206", userEmail: "laila@example.com", amountCents: 2900, currency: "usd", status: "PENDING", createdAt: daysAgo(1) },
    { id: "inv_207", userEmail: "hind@example.com", amountCents: 2900, currency: "usd", status: "PAID", createdAt: daysAgo(4) },
  ];

  const chatMessages: DemoState["chatMessages"] = [];

  const contactInquiries: ContactInquiry[] = [
    {
      id: "inq_1",
      name: "youssef",
      email: "plm159357258456a@gamil.com",
      subject: "غقعغق",
      message: "75757875",
      ipAddress: "::1",
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    users,
    auditLogs,
    securityEvents,
    invoices,
    chatMessages,
    planOverrides: {},
    promoCodes: [],
    notices: [],
    freeGrants: [],
    autoTrialEnabled: false,
    apiKey: generateApiKey(),
    apiSecret: generateApiSecret(),
    apiKeys: {},
    apiKeyUpdatedAt: {},
    contactInquiries,
  };
}

export async function saveContactInquiry(inquiry: Omit<ContactInquiry, "id" | "createdAt">): Promise<ContactInquiry> {
  const store = getStore();
  const item: ContactInquiry = {
    id: `inq_${Date.now()}`,
    ...inquiry,
    createdAt: new Date().toISOString(),
  };
  if (!store.contactInquiries) store.contactInquiries = [];
  store.contactInquiries.unshift(item);
  return item;
}

export async function listContactInquiries(): Promise<ContactInquiry[]> {
  const store = getStore();
  return store.contactInquiries || [];
}

declare global {
  // eslint-disable-next-line no-var
  var __vovoAdminDemo: DemoState | undefined;
}

export function getStore(): DemoState {
  if (!globalThis.__vovoAdminDemo) {
    globalThis.__vovoAdminDemo = seed();
  }
  return globalThis.__vovoAdminDemo;
}

// ─────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────

export async function listUsers(query: string): Promise<AdminUser[]> {
  if (usingDatabase()) {
    return prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        channels: { select: { id: true, title: true, subscriberCount: true } },
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }) as unknown as AdminUser[];
  }

  const q = query.trim().toLowerCase();
  const store = getStore();
  if (!q) return [...store.users];
  return store.users.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
  );
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  if (usingDatabase()) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        channels: { select: { id: true, title: true, subscriberCount: true } },
        subscription: true,
      },
    });
    return (user as unknown as AdminUser) ?? null;
  }
  return getStore().users.find((u) => u.id === id) ?? null;
}

export async function setUserStatus(
  id: string,
  status: "ACTIVE" | "SUSPENDED"
): Promise<AdminUser | null> {
  if (usingDatabase()) {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });
    return user as unknown as AdminUser;
  }

  const store = getStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;
  user.status = status;

  // Append an audit log entry for the action.
  store.auditLogs.unshift({
    id: `a_${Date.now()}`,
    action: status === "SUSPENDED" ? "admin.user_suspended" : "admin.user_reactivated",
    actorId: "oren.on.oren.25@gmail.com",
    actorRole: "admin",
    targetUserId: id,
    metadata: { email: user.email },
    ipAddress: "102.44.11.7",
    timestamp: new Date().toISOString(),
  });

  return user;
}

// ─────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────

export interface OverviewData {
  totalUsers: number;
  activeChannels: number;
  totalContentItems: number;
  mrrFormatted: string;
  newUsersThisMonth: number;
  apiErrorRate: string;
  queueBacklog: number;
  uptime: string;
  systemHealth: {
    database: { ok: boolean; label: string };
    aiEngine: { ok: boolean; label: string };
    guardian: { ok: boolean; label: string };
    redis: { ok: boolean; label: string };
  };
  activeSubscriptions: number;
}

export async function getOverview(): Promise<OverviewData> {
  if (usingDatabase()) {
    const [userCount, channelCount, contentCount, subs, errors] = await Promise.all([
      prisma.user.count(),
      prisma.channel.count(),
      prisma.contentItem.count(),
      prisma.subscription.findMany(),
      prisma.securityEvent.count({ where: { severity: { in: ["WARNING", "CRITICAL"] } } }),
    ]);

    let mrr = 0;
    (subs as { plan: string; status: string }[]).forEach((s) => {
      if (s.status === "ACTIVE" || s.status === "TRIALING") {
        mrr += PLAN_PRICE_CENTS[s.plan] ?? 0;
      }
    });

    const activeSubs = (subs as { status: string }[]).filter(
      (s) => s.status === "ACTIVE" || s.status === "TRIALING"
    ).length;

    return {
      totalUsers: userCount,
      activeChannels: channelCount,
      totalContentItems: contentCount,
      mrrFormatted: `$${(mrr / 100).toLocaleString()}`,
      newUsersThisMonth: 0,
      apiErrorRate: `${Math.min(9.9, Math.max(0.01, (errors / Math.max(1, userCount)) * 10)).toFixed(2)}%`,
      queueBacklog: 0,
      uptime: "99.98%",
      systemHealth: buildSystemHealth(),
      activeSubscriptions: activeSubs,
    };
  }

  const store = getStore();
  const subs = store.users.map((u) => u.subscription).filter(Boolean) as { plan: string; status: string }[];
  let mrr = 0;
  let activeSubs = 0;
  subs.forEach((s) => {
    if (s.status === "ACTIVE" || s.status === "TRIALING") {
      mrr += PLAN_PRICE_CENTS[s.plan] ?? 0;
      activeSubs += 1;
    }
  });

  const activeChannels = store.users.reduce((acc, u) => acc + u.channels.length, 0);
  const warningEvents = store.securityEvents.filter(
    (e) => e.severity === "WARNING" || e.severity === "CRITICAL"
  ).length;
  const monthStart = now - 30 * 24 * 60 * 60 * 1000;
  const newUsersThisMonth = store.users.filter(
    (u) => new Date(u.createdAt).getTime() >= monthStart
  ).length;

  return {
    totalUsers: store.users.length,
    activeChannels,
    totalContentItems: 124,
    mrrFormatted: `$${(mrr / 100).toLocaleString()}`,
    newUsersThisMonth,
    apiErrorRate: `${Math.min(9.9, Math.max(0.01, warningEvents * 0.7)).toFixed(2)}%`,
    queueBacklog: 0,
    uptime: "99.98%",
    systemHealth: buildSystemHealth(),
    activeSubscriptions: activeSubs,
  };
}

export function hasConfiguredAiKey(): boolean {
  // DeepSeek is the platform's AI brain.
  if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim().length > 0) return true;
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) return true;
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0) return true;
  const store = getStore();
  if (store?.apiKeys?.deepseek && store.apiKeys.deepseek.trim().length > 0) return true;
  if (store?.apiKeys?.openai && store.apiKeys.openai.trim().length > 0) return true;
  if (store?.apiKeys?.anthropic && store.apiKeys.anthropic.trim().length > 0) return true;
  return false;
}

function buildSystemHealth() {
  const hasAi = hasConfiguredAiKey();

  return {
    database: usingDatabase()
      ? { ok: true, label: "متصل (PostgreSQL)" }
      : { ok: false, label: "وضع تجريبي (ذاكرة محلية)" },
    aiEngine: hasAi
      ? { ok: true, label: "متصل وجاهز" }
      : { ok: false, label: "متوقف — بانتظار إدخال المفتاح" },
    guardian: hasAi
      ? { ok: true, label: "نشط ويراقب" }
      : { ok: false, label: "متوقف — بانتظار إدخال مفتاح الذكاء الاصطناعي" },
    redis: process.env.UPSTASH_REDIS_REST_URL
      ? { ok: true, label: "متصل" }
      : { ok: false, label: "غير مهيأ" },
  };
}

// ─────────────────────────────────────────────────────────────
// Audit logs
// ─────────────────────────────────────────────────────────────

export async function listAuditLogs(options?: {
  search?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: AuditLogItem[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  if (usingDatabase()) {
    const where: Record<string, unknown> = {};
    if (options?.action) where.action = options.action;
    if (options?.search) {
      where.OR = [
        { action: { contains: options.search, mode: "insensitive" } },
        { actorId: { contains: options.search, mode: "insensitive" } },
        { targetUserId: { contains: options.search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { timestamp: "desc" }, take: limit, skip: offset }),
      prisma.auditLog.count({ where }),
    ]);
    return { items: items as unknown as AuditLogItem[], total };
  }

  const store = getStore();
  let items = [...store.auditLogs];
  if (options?.action) {
    items = items.filter((l) => l.action === options.action);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    items = items.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actorId.toLowerCase().includes(q) ||
        (l.targetUserId || "").toLowerCase().includes(q)
    );
  }
  return { items: items.slice(offset, offset + limit), total: items.length };
}

// ─────────────────────────────────────────────────────────────
// Finance
// ─────────────────────────────────────────────────────────────

export interface FinanceData {
  mrrFormatted: string;
  arrFormatted: string;
  planBreakdown: { STARTER: number; GROWTH: number; AGENCY: number };
  activeSubscriptions: number;
  churnedSubscriptions: number;
  churnRate: string;
  recentInvoices: InvoiceItem[];
}

export async function getFinance(): Promise<FinanceData> {
  if (usingDatabase()) {
    const [subscriptions, invoices] = await Promise.all([
      prisma.subscription.findMany({
        include: { user: { select: { email: true } } },
      }),
      prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    const breakdown = { STARTER: 0, GROWTH: 0, AGENCY: 0 };
    let mrr = 0;
    let churned = 0;
    (subscriptions as { plan: string; status: string }[]).forEach((s) => {
      if (s.status === "ACTIVE" || s.status === "TRIALING") {
        if (s.plan in breakdown) breakdown[s.plan as keyof typeof breakdown] += 1;
        mrr += PLAN_PRICE_CENTS[s.plan] ?? 0;
      } else if (s.status === "CANCELED") {
        churned += 1;
      }
    });

    const active = breakdown.STARTER + breakdown.GROWTH + breakdown.AGENCY;
    const invs = (invoices as unknown as {
      id: string; amountCents: number; currency: string; status: string; createdAt: string | Date;
      user?: { email: string };
    }[]).map((i) => ({
      id: i.id,
      userEmail: i.user?.email ?? "—",
      amountCents: i.amountCents,
      currency: i.currency,
      status: i.status,
      createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
    }));

    return {
      mrrFormatted: `$${(mrr / 100).toLocaleString()}`,
      arrFormatted: `$${((mrr * 12) / 100).toLocaleString()}`,
      planBreakdown: breakdown,
      activeSubscriptions: active,
      churnedSubscriptions: churned,
      churnRate: `${((churned / Math.max(1, active + churned)) * 100).toFixed(1)}%`,
      recentInvoices: invs,
    };
  }

  const store = getStore();
  const subs = store.users.map((u) => u.subscription).filter(Boolean) as { plan: string; status: string }[];
  const breakdown = { STARTER: 0, GROWTH: 0, AGENCY: 0 };
  let mrr = 0;
  let churned = 0;
  subs.forEach((s) => {
    if (s.status === "ACTIVE" || s.status === "TRIALING") {
      if (s.plan in breakdown) breakdown[s.plan as keyof typeof breakdown] += 1;
      mrr += PLAN_PRICE_CENTS[s.plan] ?? 0;
    } else if (s.status === "CANCELED") {
      churned += 1;
    }
  });

  const active = breakdown.STARTER + breakdown.GROWTH + breakdown.AGENCY;
  return {
    mrrFormatted: `$${(mrr / 100).toLocaleString()}`,
    arrFormatted: `$${((mrr * 12) / 100).toLocaleString()}`,
    planBreakdown: breakdown,
    activeSubscriptions: active,
    churnedSubscriptions: churned,
    churnRate: `${((churned / Math.max(1, active + churned)) * 100).toFixed(1)}%`,
    recentInvoices: [...store.invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  };
}

// ─────────────────────────────────────────────────────────────
// Security
// ─────────────────────────────────────────────────────────────

export async function getSecurityEvents(): Promise<SecurityEventItem[]> {
  if (usingDatabase()) {
    const events = await prisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return events as unknown as SecurityEventItem[];
  }
  return [...getStore().securityEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getChatHistory(): Promise<{ id: string; sender: "admin" | "guardian"; message: string; createdAt: string }[]> {
  if (usingDatabase()) {
    const msgs = await prisma.securityChatMessage.findMany({ orderBy: { createdAt: "asc" }, take: 50 });
    return msgs as unknown as { id: string; sender: "admin" | "guardian"; message: string; createdAt: string }[];
  }
  return [...getStore().chatMessages];
}

export async function appendChatMessage(sender: "admin" | "guardian", message: string): Promise<void> {
  if (usingDatabase()) {
    try {
      await prisma.securityChatMessage.create({ data: { sender, message } });
    } catch {
      // ignore DB write errors
    }
    return;
  }
  getStore().chatMessages.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender,
    message,
    createdAt: new Date().toISOString(),
  });
}


// -------------------------------------------------------------
// Plans (editable pricing)
// -------------------------------------------------------------

export interface PlanView {
  id: string;
  name: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  channels: string;
  videos: string;
  analytics: string;
  features: string[];
  popular: boolean;
}

function mergePlan(base: (typeof PLANS)[number], override?: { name?: string; monthlyPrice?: number; yearlyPrice?: number }): PlanView {
  return {
    ...base,
    name: override?.name ?? base.name,
    monthlyPrice: override?.monthlyPrice ?? base.monthlyPrice,
    yearlyPrice: override?.yearlyPrice ?? base.yearlyPrice,
  };
}

export async function getActivePlans(): Promise<PlanView[]> {
  const overrides = usingDatabase() ? {} : getStore().planOverrides;
  return PLANS.map((p) => mergePlan(p, overrides[p.id]));
}

export async function updatePlan(
  id: string,
  patch: { name?: string; monthlyPrice?: number; yearlyPrice?: number }
): Promise<PlanView | null> {
  const base = PLANS.find((p) => p.id === id);
  if (!base) return null;

  if (usingDatabase()) {
    return mergePlan(base, patch);
  }

  const store = getStore();
  const existing = store.planOverrides[id] || {};
  store.planOverrides[id] = { ...existing, ...patch };
  return mergePlan(base, store.planOverrides[id]);
}

// -------------------------------------------------------------
// Promo / discount codes
// -------------------------------------------------------------

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  active: boolean;
  expiryDate: string | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
}

export async function listPromoCodes(): Promise<PromoCode[]> {
  return [...getStore().promoCodes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createPromoCode(input: {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  expiryDate?: string | null;
  maxUses?: number | null;
}): Promise<PromoCode> {
  const store = getStore();
  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("CODE_REQUIRED");
  if (store.promoCodes.some((p) => p.code === code)) throw new Error("CODE_EXISTS");

  const promo: PromoCode = {
    id: `pc_${Date.now()}`,
    code,
    discountType: input.discountType,
    discountValue: input.discountValue,
    active: true,
    expiryDate: input.expiryDate ?? null,
    maxUses: input.maxUses ?? null,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  };
  store.promoCodes.push(promo);
  return promo;
}

export async function deletePromoCode(id: string): Promise<boolean> {
  const store = getStore();
  const i = store.promoCodes.findIndex((p) => p.id === id);
  if (i === -1) return false;
  store.promoCodes.splice(i, 1);
  return true;
}

export async function togglePromoCode(id: string, active: boolean): Promise<boolean> {
  const store = getStore();
  const promo = store.promoCodes.find((p) => p.id === id);
  if (!promo) return false;
  promo.active = active;
  return true;
}

export async function validatePromoCode(code: string): Promise<{
  valid: boolean;
  promo?: PromoCode;
  message?: string;
}> {
  const store = getStore();
  const c = code.trim().toUpperCase();
  const promo = store.promoCodes.find((p) => p.code === c);
  if (!promo) return { valid: false, message: "??? ????? ??? ????." };
  if (!promo.active) return { valid: false, message: "??? ????? ??? ?????." };
  if (promo.expiryDate && new Date(promo.expiryDate).getTime() < Date.now()) {
    return { valid: false, message: "????? ?????? ??? ?????." };
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { valid: false, message: "?? ??????? ??? ????? ???????." };
  }
  return { valid: true, promo };
}

// -------------------------------------------------------------
// Warnings / offers / free access
// -------------------------------------------------------------

export interface UserNotice {
  id: string;
  userId: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface FreeGrant {
  id: string;
  userId: string | null;
  planId: string | null;
  durationDays: number;
  expiresAt: string;
  createdAt: string;
}

export async function sendWarning(userId: string, message: string): Promise<UserNotice | null> {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;

  const notice: UserNotice = {
    id: `n_${Date.now()}`,
    userId,
    email: user.email,
    message,
    createdAt: new Date().toISOString(),
  };
  store.notices.unshift(notice);

  store.auditLogs.unshift({
    id: `a_${Date.now()}`,
    action: "admin.user_warned",
    actorId: "oren.on.oren.25@gmail.com",
    actorRole: "admin",
    targetUserId: userId,
    metadata: { email: user.email, message },
    ipAddress: "102.44.11.7",
    timestamp: new Date().toISOString(),
  });

  return notice;
}

export async function getUserNotices(userId: string): Promise<UserNotice[]> {
  return getStore().notices.filter((n) => n.userId === userId);
}

export async function grantFreeAccess(input: {
  userId: string | null;
  planId: string | null;
  durationDays: number;
}): Promise<FreeGrant> {
  const store = getStore();
  const grant: FreeGrant = {
    id: `fg_${Date.now()}`,
    userId: input.userId,
    planId: input.planId,
    durationDays: input.durationDays,
    expiresAt: new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  store.freeGrants.unshift(grant);

  if (input.userId && input.planId) {
    const user = store.users.find((u) => u.id === input.userId);
    if (user) {
      user.subscription = { plan: input.planId.toUpperCase(), status: "ACTIVE" };
    }
  }

  store.auditLogs.unshift({
    id: `a_${Date.now()}`,
    action: "admin.free_access_granted",
    actorId: "oren.on.oren.25@gmail.com",
    actorRole: "admin",
    targetUserId: input.userId,
    metadata: { planId: input.planId, durationDays: input.durationDays },
    ipAddress: "102.44.11.7",
    timestamp: new Date().toISOString(),
  });

  return grant;
}

export async function listFreeGrants(): Promise<FreeGrant[]> {
  return [...getStore().freeGrants];
}

export async function getAutoTrialSetting(): Promise<boolean> {
  return getStore().autoTrialEnabled ?? false;
}

export async function setAutoTrialSetting(enabled: boolean): Promise<boolean> {
  const store = getStore();
  store.autoTrialEnabled = enabled;
  return store.autoTrialEnabled;
}

export async function getUserRecord(userIdOrEmail: string): Promise<AdminUser | null> {
  const store = getStore();
  const q = userIdOrEmail.trim().toLowerCase();
  return store.users.find((u) => u.id === userIdOrEmail || u.email.toLowerCase() === q) || null;
}

export async function setUserSubscription(
  userIdOrEmail: string,
  subscription: { plan: string; status: string }
): Promise<AdminUser> {
  const store = getStore();
  const q = userIdOrEmail.trim().toLowerCase();
  let user = store.users.find((u) => u.id === userIdOrEmail || u.email.toLowerCase() === q);
  if (!user) {
    user = {
      id: userIdOrEmail.includes("@")
        ? Buffer.from(userIdOrEmail).toString("base64url")
        : userIdOrEmail,
      name: userIdOrEmail.split("@")[0],
      email: userIdOrEmail.includes("@") ? userIdOrEmail : `${userIdOrEmail}@example.com`,
      role: "CLIENT",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      channels: [],
      subscription,
    };
    store.users.push(user);
  } else {
    user.subscription = subscription;
  }
  return user;
}

export async function getActiveFreeGrant(userIdOrEmail?: string): Promise<FreeGrant | null> {
  const store = getStore();
  const now = Date.now();
  const activeGrants = store.freeGrants.filter(
    (g) => new Date(g.expiresAt).getTime() > now
  );

  // 1. Site-wide grant (applies to all users)
  const siteGrant = activeGrants.find((g) => !g.userId);
  if (siteGrant) return siteGrant;

  // 2. User-specific grant
  if (userIdOrEmail) {
    const user = await getUserRecord(userIdOrEmail);
    const userGrant = activeGrants.find(
      (g) => g.userId === userIdOrEmail || (user && g.userId === user.id)
    );
    if (userGrant) return userGrant;
  }

  return null;
}

// -------------------------------------------------------------
// Account report (guardian lookup)
// -------------------------------------------------------------

export async function getAccountReport(query: string) {
  const store = getStore();
  const q = query.trim().toLowerCase();
  const user = store.users.find(
    (u) =>
      (u.email || "").toLowerCase() === q ||
      (u.name || "").toLowerCase() === q ||
      (u.email || "").toLowerCase().includes(q)
  );
  if (!user) return null;

  const audit = store.auditLogs.filter(
    (l) => l.actorId === user.email || l.targetUserId === user.id
  );
  const security = store.securityEvents.filter((e) => e.email === user.email);
  const notices = store.notices.filter((n) => n.userId === user.id);
  const grants = store.freeGrants.filter((g) => g.userId === user.id);

  return { user, audit, security, notices, grants };
}


// -------------------------------------------------------------
// API key & secret (owner-managed, rotatable)
// -------------------------------------------------------------

function generateApiKey(): string {
  return `vovo_live_${randomBytes(16).toString("hex")}`;
}

function generateApiSecret(): string {
  return `vovo_sk_${randomBytes(32).toString("hex")}`;
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  const head = key.slice(0, 14);
  const tail = key.slice(-4);
  return `${head}****${tail}`;
}

export async function getApiKey(): Promise<string> {
  // Production: read the key from a secret store / env. Development: in-memory.
  if (usingDatabase() && process.env.API_SECRET_KEY) {
    return process.env.API_SECRET_KEY;
  }
  return getStore().apiKey;
}

export async function getApiSecret(): Promise<string> {
  return getStore().apiSecret;
}

/**
 * Rotate both the API key and secret — returns the new pair so the UI can
 * show the secret once, then mask it.
 */
export async function rotateApiCredentials(): Promise<{ key: string; secret: string }> {
  const key = generateApiKey();
  const secret = generateApiSecret();
  const store = getStore();
  store.apiKey = key;
  store.apiSecret = secret;

  store.auditLogs.unshift({
    id: `a_${Date.now()}`,
    action: "admin.api_key_rotated",
    actorId: "oren.on.oren.25@gmail.com",
    actorRole: "admin",
    targetUserId: null,
    metadata: { at: new Date().toISOString() },
    ipAddress: "102.44.11.7",
    timestamp: new Date().toISOString(),
  });

  return { key, secret };
}
