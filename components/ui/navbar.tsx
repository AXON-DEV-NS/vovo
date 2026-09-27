"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";

export function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/pricing", label: t("pricing.title") },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: t("nav.contactUs") },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-paper backdrop-blur-sm">
      <nav className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="group transition-opacity duration-200 hover:opacity-80">
          <Logo />
        </Link>

        {/* Desktop: nav items — the active page's item hides and the rest re-arrange */}
        <div className="hidden md:flex items-center">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <div
                key={link.href}
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  active
                    ? "max-w-0 -translate-y-1.5 opacity-0"
                    : "mx-4 max-w-[11rem] translate-y-0 opacity-100"
                )}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "link-underline inline-block py-1 text-sm font-medium transition-colors active:scale-95",
                    pathname === link.href ? "text-ink" : "text-ink-mute hover:text-ink"
                  )}
                >
                  {link.label}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login?mode=signin">
            <Button variant="ghost" size="sm">
              {t("common.signIn")}
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">
              {t("common.getStarted")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden rounded-md p-2 text-ink-mute hover:bg-paper-low active:scale-95 transition-transform"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-paper-high animate-fade-in">
          <div className="container-wide py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <div
                  key={link.href}
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    active ? "max-h-0 -translate-x-2 opacity-0" : "max-h-12 translate-x-0 opacity-100"
                  )}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-4 py-3 text-sm font-medium transition-colors active:scale-[0.98]",
                      pathname === link.href
                        ? "bg-paper-low text-ink"
                        : "text-ink-mute hover:bg-paper-low hover:text-ink"
                    )}
                  >
                    {link.label}
                  </Link>
                </div>
              );
            })}
            <hr className="border-line my-2" />
            <div className="flex gap-2 mt-2">
              <Link
                href="/login?mode=signin"
                onClick={() => setMobileOpen(false)}
                className="flex-1"
              >
                <Button variant="secondary" size="lg" className="w-full">
                  {t("common.signIn")}
                </Button>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1"
              >
                <Button variant="primary" size="lg" className="w-full">
                  {t("common.getStarted")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
