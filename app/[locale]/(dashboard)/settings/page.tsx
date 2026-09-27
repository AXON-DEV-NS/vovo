"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { CreditCard, Download, Loader2, Monitor, Trash2 } from "lucide-react";

interface Account {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface Channel {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  connectedAt: string;
}

interface Invoice {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
}

interface AccessStatus {
  hasAccess: boolean;
  status: "ACTIVE" | "TRIALING" | "EVENT" | "LOCKED";
  reason: string;
  planId: string | null;
  planName: string | null;
  daysRemaining?: number;
  expiresAt?: string;
  message: string;
}

interface SessionRow {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

function describeDevice(userAgent: string | null) {
  if (!userAgent) return null;
  const os = /Windows/i.test(userAgent)
    ? "Windows"
    : /iPhone|iPad|iPod/i.test(userAgent)
      ? "iOS"
      : /Mac OS X/i.test(userAgent)
        ? "macOS"
        : /Android/i.test(userAgent)
          ? "Android"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : null;
  const browser = /Edg\//i.test(userAgent)
    ? "Edge"
    : /OPR\//i.test(userAgent)
      ? "Opera"
      : /Chrome\//i.test(userAgent)
        ? "Chrome"
        : /Firefox\//i.test(userAgent)
          ? "Firefox"
          : /Safari\//i.test(userAgent)
            ? "Safari"
            : null;
  if (!os && !browser) return null;
  return [os, browser].filter(Boolean).join(" / ");
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);

  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [disconnectTarget, setDisconnectTarget] = useState<Channel | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [accountRes, channelsRes, accessRes, invoicesRes, sessionsRes] = await Promise.allSettled([
        fetch("/api/settings/account").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/youtube/status").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/billing/status").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/billing/invoices").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/settings/sessions").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (cancelled) return;

      if (accountRes.status === "fulfilled" && accountRes.value) {
        setAccount(accountRes.value);
        setName(accountRes.value.name ?? "");
      }
      if (channelsRes.status === "fulfilled" && channelsRes.value?.channels) {
        setChannels(channelsRes.value.channels);
      }
      if (accessRes.status === "fulfilled" && accessRes.value) {
        setAccess(accessRes.value);
      }
      if (invoicesRes.status === "fulfilled" && invoicesRes.value?.invoices) {
        setInvoices(invoicesRes.value.invoices);
      }
      if (sessionsRes.status === "fulfilled" && Array.isArray(sessionsRes.value)) {
        setSessions(sessionsRes.value);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveAccount = async () => {
    if (!name.trim()) return;
    setSavingAccount(true);
    try {
      const res = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("request failed");
      const updated = (await res.json()) as { name: string | null };
      setAccount((prev) => (prev ? { ...prev, name: updated.name } : prev));
      addToast(t("account.saveSuccess"), "success");
    } catch {
      addToast(t("account.saveError"), "error");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/channels/${disconnectTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("request failed");
      setChannels((prev) => prev.filter((channel) => channel.id !== disconnectTarget.id));
      addToast(t("channels.disconnectSuccess"), "success");
      setDisconnectTarget(null);
    } catch {
      addToast(t("channels.disconnectError"), "error");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/settings/sessions/${id}/revoke`, { method: "DELETE" });
      if (!res.ok) throw new Error("request failed");
      setSessions((prev) => prev.filter((session) => session.id !== id));
      addToast(t("security.revokeSuccess"), "success");
    } catch {
      addToast(t("security.revokeError"), "error");
    } finally {
      setRevokingId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) throw new Error("request failed");
      addToast(t("security.deleteAccountSuccess"), "success");
      window.location.href = "/";
    } catch {
      addToast(t("security.deleteAccountError"), "error");
      setDeleting(false);
    }
  };

  const planKey = access?.planId ? access.planId.toUpperCase() : null;
  const planLabel =
    planKey && t.has(`plans.${planKey}`) ? t(`plans.${planKey}`) : access?.planName ?? "";
  const statusLabel =
    access && t.has(`statuses.${access.status}`) ? t(`statuses.${access.status}`) : access?.status ?? "";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="text-ink-mute">{t("description")}</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="mb-6 flex-wrap h-auto p-1.5">
          <TabsTrigger value="account">{t("tabs.account")}</TabsTrigger>
          <TabsTrigger value="channels">{t("tabs.channels")}</TabsTrigger>
          <TabsTrigger value="billing">{t("tabs.billing")}</TabsTrigger>
          <TabsTrigger value="security">{t("tabs.security")}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Account */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("account.title")}</CardTitle>
              <CardDescription>{t("account.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                {account?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.avatarUrl}
                    alt={account.name ?? account.email}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
                    {(account?.name ?? account?.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-ink">{account?.name ?? "—"}</p>
                  <p className="text-sm text-ink-mute">{account?.email ?? ""}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={t("account.name")}
                  placeholder={t("account.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label={t("account.email")}
                  value={account?.email ?? ""}
                  readOnly
                  disabled
                  helperText={t("account.emailReadOnly")}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveAccount}
                disabled={savingAccount || !name.trim() || name.trim() === (account?.name ?? "")}
              >
                {savingAccount ? t("account.saving") : t("account.saveChanges")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 2: Channels */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>{t("channels.title")}</CardTitle>
              <CardDescription>{t("channels.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <EmptyState
                  title={t("channels.noChannels")}
                  description={t("channels.noChannelsDesc")}
                  action={{
                    label: t("channels.addChannel"),
                    onClick: () => router.push("/channels/connect"),
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex flex-col gap-4 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {channel.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={channel.thumbnailUrl}
                            alt={channel.title}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                            {channel.title.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-ink">{channel.title}</p>
                          <p className="text-xs text-ink-mute">
                            {channel.subscriberCount.toLocaleString("en-US")} {t("channels.subscribers")}{" "}
                            • {t("channels.connected")} {formatDate(channel.connectedAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDisconnectTarget(channel)}
                      >
                        {t("channels.disconnect")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Billing */}
        <TabsContent value="billing">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("billing.currentPlan")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!access || !access.hasAccess ? (
                <EmptyState
                  icon={<CreditCard className="h-8 w-8 text-ink-faint" />}
                  title={t("billing.noSubscription")}
                  description={t("billing.noSubscriptionDesc")}
                  action={{
                    label: t("billing.choosePlan"),
                    onClick: () => router.push("/pricing"),
                  }}
                />
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <h3 className="text-lg font-bold text-ink">{planLabel}</h3>
                      <Badge variant={access.status === "ACTIVE" ? "success" : "default"}>
                        {statusLabel}
                      </Badge>
                    </div>
                    {access.expiresAt && (
                      <p className="text-sm text-ink-mute">
                        {t("billing.renewsOn")}: {formatDate(access.expiresAt)}
                      </p>
                    )}
                  </div>
                  <Button variant="primary" onClick={() => router.push("/pricing")}>
                    {t("billing.upgrade")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("billing.invoiceHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-mute">{t("billing.noInvoices")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("billing.invoiceDate")}</TableHead>
                      <TableHead>{t("billing.invoiceAmount")}</TableHead>
                      <TableHead>{t("billing.invoiceStatus")}</TableHead>
                      <TableHead className="text-right">{t("billing.invoiceDownload")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>{formatPrice(invoice.amountCents, invoice.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "PAID" ? "success" : "default"}>
                            {t.has(`invoiceStatuses.${invoice.status}`)
                              ? t(`invoiceStatuses.${invoice.status}`)
                              : invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!invoice.pdfUrl}
                            onClick={() => {
                              if (invoice.pdfUrl) window.open(invoice.pdfUrl, "_blank", "noopener");
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Security */}
        <TabsContent value="security">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("security.sessions")}</CardTitle>
              <CardDescription>{t("security.sessionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-mute">{t("security.noSessions")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("security.device")}</TableHead>
                      <TableHead>{t("security.ipAddress")}</TableHead>
                      <TableHead>{t("security.lastActive")}</TableHead>
                      <TableHead className="text-right">{t("security.revoke")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-ink-faint" />
                          {describeDevice(session.userAgent) ?? t("security.unknownDevice")}
                        </TableCell>
                        <TableCell>{session.ipAddress ?? "—"}</TableCell>
                        <TableCell>{formatDateTime(session.lastSeenAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={revokingId === session.id}
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            {revokingId === session.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("security.revoke")
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {t("security.deleteAccount")}
              </CardTitle>
              <CardDescription>{t("security.deleteAccountWarning")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="danger"
                onClick={() => {
                  setDeleteStep(1);
                  setDeleteConfirmText("");
                  setDeleteModalOpen(true);
                }}
              >
                {t("security.deleteAccount")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disconnect Channel Modal */}
      <Modal
        open={disconnectTarget !== null}
        onClose={() => setDisconnectTarget(null)}
        title={t("channels.disconnectTitle")}
        description={t("channels.disconnectWarning")}
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDisconnectTarget(null)} disabled={disconnecting}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("channels.disconnectConfirm")}
          </Button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t("security.deleteAccount")}
      >
        <div className="space-y-4">
          {deleteStep === 1 ? (
            <>
              <p className="text-sm text-ink-soft">{t("security.deleteAccountWarning")}</p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button variant="danger" onClick={() => setDeleteStep(2)}>
                  {t("common.continue")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">{t("security.deleteAccountStep2")}</p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t("security.deleteAccountInput")}
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="danger"
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("security.deleteAccountConfirm")}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
