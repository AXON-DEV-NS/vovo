import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Fraunces, Inter, Noto_Sans_Arabic } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { TransitionOverlay } from "@/components/ui/transition-overlay";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { GlobalLoadingGuard } from "@/components/ui/global-loading-guard";
import { ThemeColorSync } from "@/components/ui/theme-color-sync";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Arabic script support — used only inside the admin/control panel section.
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VOVO Agent AI",
    template: "%s — VOVO Agent AI",
  },
  description:
    "Your autonomous AI-powered YouTube channel manager. AI handles research, content creation, publishing, and optimization — you just approve.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VOVO Agent AI",
  },
  // Prevent Chrome/Google Translate from rewriting the DOM — its injected
  // <font> wrappers break React reconciliation (insertBefore crashes).
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Cream Beige — the site's primary `paper` color.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5EFE1" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1915" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir="ltr" translate="no" className="notranslate">
      <body
        className={`${fraunces.variable} ${inter.variable} ${notoSansArabic.variable} font-sans antialiased bg-paper text-ink`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>{children}</ToastProvider>
          <TransitionOverlay />
          <LoadingOverlay />
          <GlobalLoadingGuard />
          <ThemeColorSync />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
