import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { SITE_NAME } from "@/lib/constants";
import { Logo } from "@/components/ui/logo";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");

  const columns = [
    {
      title: t("product"),
      links: [
        { href: "/pricing", label: "Pricing" },
        { href: "/#how-it-works", label: "How It Works" },
        { href: "/#features", label: "Features" },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/contact", label: t("contactUs") },
        { href: "/support", label: t("helpCenter") },
        { href: "/blog", label: t("blog") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/legal/privacy", label: t("privacy") },
        { href: "/legal/terms", label: t("terms") },
        { href: "/legal/refund", label: t("refund") },
        { href: "/legal/cancellation", label: t("cancellation") },
      ],
    },
  ];

  return (
    <footer className="relative bg-ink text-paper-high">
      <div className="container-wide pb-10 pt-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5">
            <Link href="/" className="group mb-6 inline-flex transition-opacity duration-200 hover:opacity-80">
              <Logo variant="paper" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-paper/55">
              {t("builtWith")}
            </p>
          </div>

          {/* Link columns */}
          <div className="col-span-2 md:col-span-7">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
              {columns.map((col) => (
                <div key={col.title}>
                  <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-400">
                    {col.title}
                  </h4>
                  <ul className="space-y-3.5">
                    {col.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link href={link.href} className="vovo-footer-link text-sm">
                          {link.label}
                          <ArrowUpRight className="h-3.5 w-3.5 text-gold-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row">
          <p className="text-xs text-paper/40">
            &copy; {new Date().getFullYear()} {SITE_NAME}. {t("allRightsReserved")}
          </p>
          <p className="font-mono text-[11px] tracking-wider text-paper/30">v1.0</p>
        </div>
      </div>
    </footer>
  );
}
