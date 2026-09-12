"use client";

import { useState } from "react";
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
import { cn } from "@/lib/cn";

// Icons
import { Trash2, Monitor, Download, CreditCard } from "lucide-react";

// Mock data
const mockUser = { name: "Alex Creator", email: "alex@example.com", loginMethod: "google" };
const mockChannels = [
  { id: "ch1", title: "Tech Insights", subscribers: 124500, connectedAt: "2026-01-15" },
  { id: "ch2", title: "AI Daily", subscribers: 32100, connectedAt: "2026-03-22" },
];
const mockSubscription = {
  plan: "GROWTH",
  status: "ACTIVE",
  currentPeriodStart: "2026-09-01",
  currentPeriodEnd: "2026-09-30",
  cancelAtPeriodEnd: false,
};
const mockInvoices = [
  { id: "inv1", createdAt: "2026-09-01", amountCents: 7900, currency: "usd", status: "PAID" },
  { id: "inv2", createdAt: "2026-08-01", amountCents: 7900, currency: "usd", status: "PAID" },
  { id: "inv3", createdAt: "2026-07-01", amountCents: 7900, currency: "usd", status: "PAID" },
];
const mockSessions = [
  { id: "sess1", device: "Mac OS / Chrome", ip: "192.168.1.1", lastActive: "2026-09-04 10:00" },
  { id: "sess2", device: "iOS / Safari", ip: "10.0.0.5", lastActive: "2026-09-03 15:30" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
        checked ? "bg-green-600" : "bg-line"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper-high shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { addToast } = useToast();

  // Tab 1 State
  const [name, setName] = useState(mockUser.name);

  // Tab 2 State
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [channelToDisconnect, setChannelToDisconnect] = useState<string | null>(null);
  const [channels, setChannels] = useState(mockChannels);

  // Tab 3 State
  const [notifications, setNotifications] = useState({
    emailReview: true,
    emailSummary: true,
    emailSecurity: true,
    inAppReview: true,
    inAppAi: true,
    inAppBilling: false,
  });

  // Tab 4 State
  // Mock data used directly

  // Tab 5 State
  const [sessions, setSessions] = useState(mockSessions);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleSaveAccount = async () => {
    try {
      // Stub PATCH /api/settings/account
      console.log("PATCH /api/settings/account", { name });
      addToast(t("account.saveSuccess", { fallback: "Profile updated successfully!" }), "success");
    } catch (e) {
      addToast(t("account.saveError", { fallback: "Failed to update profile." }), "error");
    }
  };

  const handleDisconnect = async () => {
    if (!channelToDisconnect) return;
    try {
      // Stub DELETE /api/channels/[id]
      console.log(`DELETE /api/channels/${channelToDisconnect}`);
      setChannels(channels.filter((c) => c.id !== channelToDisconnect));
      addToast(t("channels.disconnectSuccess", { fallback: "Channel disconnected." }), "success");
    } catch (e) {
      addToast(t("channels.disconnectError", { fallback: "Error disconnecting channel." }), "error");
    } finally {
      setDisconnectModalOpen(false);
      setChannelToDisconnect(null);
    }
  };

  const handleSaveNotifications = async () => {
    console.log("Saving notifications...", notifications);
    addToast(t("notifications.saveSuccess", { fallback: "Preferences saved successfully!" }), "success");
  };

  const handleRevokeSession = async (id: string) => {
    console.log(`DELETE /api/settings/sessions/${id}/revoke`);
    setSessions(sessions.filter((s) => s.id !== id));
    addToast(t("security.sessionRevoked", { fallback: "Session revoked." }), "success");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    try {
      // Stub DELETE /api/settings/account/delete
      console.log("DELETE /api/settings/account/delete", { confirm: true });
      addToast(t("security.accountDeleted", { fallback: "Account deleted." }), "success");
      router.push("/");
    } catch (e) {
      addToast(t("security.accountDeleteError", { fallback: "Error deleting account." }), "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("title", { fallback: "Settings" })}</h1>
        <p className="text-ink-mute">{t("description", { fallback: "Manage your account settings and preferences." })}</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="mb-6 flex-wrap h-auto p-1.5">
          <TabsTrigger value="account">{t("tabs.account", { fallback: "Account" })}</TabsTrigger>
          <TabsTrigger value="channels">{t("tabs.channels", { fallback: "Channels" })}</TabsTrigger>
          <TabsTrigger value="notifications">{t("tabs.notifications", { fallback: "Notifications" })}</TabsTrigger>
          <TabsTrigger value="billing">{t("tabs.billing", { fallback: "Billing" })}</TabsTrigger>
          <TabsTrigger value="security">{t("tabs.security", { fallback: "Security" })}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Account */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("account.profileTitle", { fallback: "Profile Information" })}</CardTitle>
              <CardDescription>{t("account.profileDesc", { fallback: "Update your account's profile information." })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-xl font-bold text-green-700">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-ink">{t("account.avatar", { fallback: "Profile Picture" })}</p>
                  <p className="text-sm text-ink-mute">{t("account.avatarDesc", { fallback: "Synced from your Google account." })}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={t("account.nameLabel", { fallback: "Name" })}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label={t("account.emailLabel", { fallback: "Email" })}
                  value={mockUser.email}
                  readOnly
                  disabled
                  helperText={t("account.emailHelper", { fallback: "Email cannot be changed." })}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">{t("account.loginMethod", { fallback: "Login Method" })}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-ink-soft">
                    Google OAuth
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAccount}>{t("account.saveBtn", { fallback: "Save Changes" })}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 2: Channels */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>{t("channels.title", { fallback: "Connected Channels" })}</CardTitle>
              <CardDescription>{t("channels.desc", { fallback: "Manage your connected YouTube platforms." })}</CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <EmptyState
                  title={t("channels.emptyTitle", { fallback: "No channels connected" })}
                  description={t("channels.emptyDesc", { fallback: "Connect a channel to get started." })}
                />
              ) : (
                <div className="space-y-4">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between rounded-xl border border-line p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">
                          {channel.title.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-ink">{channel.title}</p>
                          <p className="text-xs text-ink-mute" suppressHydrationWarning>
                            {channel.subscribers.toLocaleString("en-US")} {t("channels.subscribers", { fallback: "subscribers" })} • {t("channels.connected", { fallback: "Connected" })} {channel.connectedAt}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setChannelToDisconnect(channel.id);
                          setDisconnectModalOpen(true);
                        }}
                      >
                        {t("channels.disconnectBtn", { fallback: "Disconnect" })}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("notifications.title", { fallback: "Notification Preferences" })}</CardTitle>
              <CardDescription>{t("notifications.desc", { fallback: "Choose what updates you want to receive." })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h4 className="text-sm font-medium text-ink mb-4">{t("notifications.emailTitle", { fallback: "Email Notifications" })}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{t("notifications.emailReview", { fallback: "Content ready for review" })}</p>
                    </div>
                    <Toggle checked={notifications.emailReview} onChange={(v) => setNotifications({ ...notifications, emailReview: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{t("notifications.emailSummary", { fallback: "Weekly performance summary" })}</p>
                    </div>
                    <Toggle checked={notifications.emailSummary} onChange={(v) => setNotifications({ ...notifications, emailSummary: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{t("notifications.emailSecurity", { fallback: "Security alerts" })}</p>
                    </div>
                    <Toggle checked={notifications.emailSecurity} onChange={(v) => setNotifications({ ...notifications, emailSecurity: v })} />
                  </div>
                </div>
              </div>
              <div className="border-t border-paper-low pt-6">
                <h4 className="text-sm font-medium text-ink mb-4">{t("notifications.inAppTitle", { fallback: "In-App Notifications" })}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{t("notifications.inAppReview", { fallback: "Content ready for review" })}</p>
                    </div>
                    <Toggle checked={notifications.inAppReview} onChange={(v) => setNotifications({ ...notifications, inAppReview: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{t("notifications.inAppAi", { fallback: "AI activity alerts" })}</p>
                    </div>
                    <Toggle checked={notifications.inAppAi} onChange={(v) => setNotifications({ ...notifications, inAppAi: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{t("notifications.inAppBilling", { fallback: "Billing updates" })}</p>
                    </div>
                    <Toggle checked={notifications.inAppBilling} onChange={(v) => setNotifications({ ...notifications, inAppBilling: v })} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications}>{t("notifications.saveBtn", { fallback: "Save Preferences" })}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 4: Billing */}
        <TabsContent value="billing">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("billing.planTitle", { fallback: "Current Plan" })}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* // TODO: connect real billing provider */}
              {!mockSubscription ? (
                <EmptyState
                  icon={<CreditCard className="h-8 w-8 text-ink-faint" />}
                  title={t("billing.noPlan", { fallback: "No active subscription" })}
                  description={t("billing.noPlanDesc", { fallback: "Subscribe to unlock features." })}
                  action={{
                    label: t("billing.choosePlan", { fallback: "Choose a Plan" }),
                    onClick: () => router.push("/pricing"),
                  }}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-ink">{mockSubscription.plan}</h3>
                      <Badge variant="success">{mockSubscription.status}</Badge>
                    </div>
                    <p className="text-sm text-ink-mute">
                      {t("billing.period", { fallback: "Current period" })}: {mockSubscription.currentPeriodStart} to {mockSubscription.currentPeriodEnd}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary">{t("billing.downgrade", { fallback: "Downgrade" })}</Button>
                    <Button variant="primary">{t("billing.upgrade", { fallback: "Upgrade" })}</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("billing.historyTitle", { fallback: "Invoice History" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("billing.date", { fallback: "Date" })}</TableHead>
                    <TableHead>{t("billing.amount", { fallback: "Amount" })}</TableHead>
                    <TableHead>{t("billing.status", { fallback: "Status" })}</TableHead>
                    <TableHead className="text-right">{t("billing.download", { fallback: "Download" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.createdAt}</TableCell>
                      <TableCell>${(inv.amountCents / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="success" className="bg-green-100 text-green-700 border-none">{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Security */}
        <TabsContent value="security">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("security.sessionsTitle", { fallback: "Active Sessions" })}</CardTitle>
              <CardDescription>{t("security.sessionsDesc", { fallback: "Manage your active login sessions across devices." })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("security.device", { fallback: "Device/Browser" })}</TableHead>
                    <TableHead>{t("security.ip", { fallback: "IP Address" })}</TableHead>
                    <TableHead>{t("security.lastActive", { fallback: "Last Active" })}</TableHead>
                    <TableHead className="text-right">{t("security.action", { fallback: "Action" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((sess) => (
                    <TableRow key={sess.id}>
                      <TableCell className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-ink-faint" />
                        {sess.device}
                      </TableCell>
                      <TableCell>{sess.ip}</TableCell>
                      <TableCell>{sess.lastActive}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(sess.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          {t("security.revoke", { fallback: "Revoke" })}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {t("security.deleteAccountTitle", { fallback: "Delete Account" })}
              </CardTitle>
              <CardDescription>
                {t("security.deleteAccountDesc", { fallback: "Permanently delete your account and all associated data." })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-soft mb-4">
                {t("security.deleteWarning", { fallback: "Once you delete your account, there is no going back. Please be certain." })}
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  setDeleteStep(1);
                  setDeleteConfirmText("");
                  setDeleteModalOpen(true);
                }}
              >
                {t("security.deleteAccountBtn", { fallback: "Delete My Account" })}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disconnect Channel Modal */}
      <Modal
        open={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        title={t("channels.disconnectModalTitle", { fallback: "Disconnect Channel" })}
        description={t("channels.disconnectModalDesc", { fallback: "All content items for this channel will be deleted. This cannot be undone." })}
      >
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDisconnectModalOpen(false)}>
            {t("common.cancel", { fallback: "Cancel" })}
          </Button>
          <Button variant="danger" onClick={handleDisconnect}>
            {t("channels.confirmDisconnect", { fallback: "Disconnect" })}
          </Button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t("security.deleteAccountModalTitle", { fallback: "Delete Account" })}
      >
        <div className="space-y-4">
          {deleteStep === 1 ? (
            <>
              <p className="text-sm text-ink-soft">
                {t("security.deleteAccountStep1Desc", { fallback: "All your channels, content items, and data will be permanently deleted. This cannot be undone." })}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
                  {t("common.cancel", { fallback: "Cancel" })}
                </Button>
                <Button variant="danger" onClick={() => setDeleteStep(2)}>
                  {t("common.continue", { fallback: "Continue" })}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">
                {t("security.deleteAccountStep2Desc", { fallback: "Type 'DELETE' to confirm." })}
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
                  {t("common.cancel", { fallback: "Cancel" })}
                </Button>
                <Button
                  variant="danger"
                  disabled={deleteConfirmText !== "DELETE"}
                  onClick={handleDeleteAccount}
                >
                  {t("security.permanentlyDeleteBtn", { fallback: "Permanently Delete Account" })}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
