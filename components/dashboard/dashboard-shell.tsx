"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { VovoAssistant } from "@/components/dashboard/vovo-assistant";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Tv,
  Lightbulb,
  CalendarDays,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  user?: {
    userId: string;
    email: string;
    name?: string;
    role: "USER" | "ADMIN";
  } | null;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSignOut() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      window.location.href = "/login";
    }
  }

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard.overview") },
    { href: "/channels/connect", icon: Tv, label: "Channels" },
    { href: "/niche", icon: Lightbulb, label: "Niche" },
    { href: "/content-calendar", icon: CalendarDays, label: "Calendar" },
    { href: "/analytics", icon: BarChart3, label: t("common.dashboard") },
    { href: "/settings", icon: Settings, label: t("common.settings") },
    { href: "/support", icon: HelpCircle, label: t("common.support") },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const userInitial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="flex h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-paper-low bg-paper-high transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-paper-low", sidebarCollapsed ? "justify-center px-2" : "gap-2 px-4")}>
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" markOnly={sidebarCollapsed} />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href) ? "bg-green-50 text-green-700" : "text-ink-mute hover:bg-paper hover:text-ink",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-paper-low p-2">
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-mute hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50",
              sidebarCollapsed && "justify-center px-2"
            )}
            title={sidebarCollapsed ? t("common.signOut") : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{loggingOut ? "..." : t("common.signOut")}</span>}
          </button>
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-paper-low text-ink-faint hover:text-ink-soft transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-paper-high z-50 animate-slide-in-right flex flex-col">
            <div className="flex h-16 items-center justify-between border-b border-paper-low px-4">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-ink-faint hover:bg-paper-low">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-green-50 text-green-700" : "text-ink-mute hover:bg-paper"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-paper-low p-2 mt-auto">
              <button
                onClick={handleSignOut}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-mute hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>{loggingOut ? "..." : t("common.signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-paper-low bg-paper-high px-4 lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden rounded-lg p-2 text-ink-soft hover:bg-paper-low">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-ink-mute hover:bg-paper-low" title="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500" />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700 select-none"
                title={user?.email || "User"}
              >
                {userInitial}
              </div>
              {user?.name && (
                <span className="hidden sm:inline-block text-xs font-medium text-ink-soft max-w-[120px] truncate">
                  {user.name}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* VOVO — channel manager assistant (account settings are out of scope) */}
      <VovoAssistant />
    </div>
  );
}
