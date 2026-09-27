import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ToastProvider } from "@/components/ui/toast";
import { TransitionOverlay } from "@/components/ui/transition-overlay";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { GlobalLoadingGuard } from "@/components/ui/global-loading-guard";
import { IntroSequence } from "@/components/marketing/intro-sequence";
import { ThemeColorSync } from "@/components/ui/theme-color-sync";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VOVO Agent AI",
    template: "%s — VOVO Agent AI",
  },
  description:
    "Your autonomous AI-powered YouTube channel manager. AI handles research, content creation, publishing, and optimization — you just approve.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://vovo-five.vercel.app"
  ),
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon-32.png", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://vovo-five.vercel.app",
    siteName: "VOVO Agent AI",
    title: "VOVO Agent AI — Autonomous YouTube Channel Manager",
    description:
      "AI handles research, content creation, publishing, and optimization — you just approve.",
    images: [
      {
        url: "/vovo25.jpg",
        width: 1200,
        height: 630,
        alt: "VOVO Agent AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOVO Agent AI — Autonomous YouTube Channel Manager",
    description:
      "AI handles research, content creation, publishing, and optimization — you just approve.",
    images: ["/vovo25.jpg"],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-paper text-ink">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>{children}</ToastProvider>
          <IntroSequence />
          <TransitionOverlay />
          <LoadingOverlay />
          <GlobalLoadingGuard />
          <ThemeColorSync />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
