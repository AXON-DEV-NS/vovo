"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/constants";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [guardianActive, setGuardianActive] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/guardian/status")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && typeof data.active === "boolean") {
          setGuardianActive(data.active);
        }
      })
      .catch(() => {
        if (mounted) setGuardianActive(false);
      });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // ignore error
    }
    // Never reveal the panel location after sign-out — go to the homepage.
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { label: "Overview", href: ADMIN_ROUTES.overview, icon: "📊" },
    { label: "Users", href: ADMIN_ROUTES.users, icon: "👥" },
    { label: "Plans & pricing", href: ADMIN_ROUTES.plans, icon: "💰" },
    { label: "Promo codes", href: ADMIN_ROUTES.promoCodes, icon: "🏷️" },
    { label: "Security guardian chat", href: ADMIN_ROUTES.securityChat, icon: "🛡️" },
    { label: "Audit logs", href: ADMIN_ROUTES.auditLogs, icon: "📜" },
    { label: "Finance", href: ADMIN_ROUTES.finance, icon: "💳" },
  ];

  return (
    <div
      dir="ltr"
      lang="en"
      translate="no"
      className="notranslate min-h-screen bg-paper text-ink flex flex-col font-sans"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper-high/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-paper-high font-bold flex items-center justify-center text-sm shadow-xs">
            HQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink tracking-tight">VOVO HQ</span>
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">
                Restricted admin panel
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all ${
              guardianActive === true
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : guardianActive === false
                ? "text-amber-800 bg-amber-50 border-amber-200"
                : "text-ink-mute bg-paper-low border-line"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                guardianActive === true
                  ? "bg-emerald-500 animate-pulse"
                  : guardianActive === false
                  ? "bg-amber-500"
                  : "bg-ink-mute"
              }`}
            ></span>
            <span className="font-medium">
              {guardianActive === true
                ? "Security guardian active & monitoring"
                : guardianActive === false
                ? "Security guardian offline (waiting for AI key)"
                : "Checking guardian..."}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-medium text-ink-soft hover:text-red-600 bg-paper-low hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <nav className="border-b border-line bg-paper-high px-6 py-2 overflow-x-auto">
        <div className="flex gap-2 max-w-7xl mx-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-ink text-paper-high shadow-xs"
                    : "text-ink-soft hover:bg-paper-low hover:text-ink"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-line bg-paper-high py-3 px-6 text-center text-xs text-ink-faint">
        The secure VOVO HQ gateway — restricted to authorized administrators only. All actions are recorded in an immutable audit log.
      </footer>
    </div>
  );
}
