"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ticket,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CLIENT" | "RESOLVED" | "CLOSED";

interface MockTicket {
  id: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  _count: { messages: number };
}

// ─── Static Data ──────────────────────────────────────────────────────────────

interface FaqItem {
  category: string;
  q: string;
  a: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    category: "Getting Started",
    q: "How do I connect my YouTube channel?",
    a: "Navigate to Channels → Connect New Channel. You will be prompted to sign in with Google and grant the required permissions. The process takes under 60 seconds.",
  },
  {
    category: "Getting Started",
    q: "How long does the initial channel scan take?",
    a: "The initial scan typically takes 2–5 minutes depending on how many videos you have published. The AI analyzes your existing content, audience patterns, and competitor landscape before building your strategy.",
  },
  {
    category: "Getting Started",
    q: "Can I connect multiple channels?",
    a: "Yes. The Growth plan supports 3 channels and the Agency plan supports 10. You can connect additional channels from the Channels section in your dashboard.",
  },
  {
    category: "Content & AI",
    q: "Who approves content before it goes live?",
    a: "You do. Every script, thumbnail, and video draft requires your explicit approval before the AI schedules or publishes it. Nothing goes live without a green light from you.",
  },
  {
    category: "Content & AI",
    q: "Can I edit the AI-generated scripts?",
    a: "Absolutely. When a content item is in Ready for Review state, you can open it, edit the script directly, and then approve. You have full editorial control.",
  },
  {
    category: "Content & AI",
    q: "How does the AI decide what content to create?",
    a: "The AI continuously monitors trending topics, competitor activity, and your channel performance data. It combines this with your niche and tone settings to propose content with the highest probability of growing your channel.",
  },
  {
    category: "Billing",
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel from the Billing tab in Settings. Your access continues until the end of your current billing period. No partial refunds for unused time.",
  },
  {
    category: "Billing",
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, American Express). Annual plans offer a 20% discount compared to monthly pricing.",
  },
  {
    category: "Billing",
    q: "What happens to my content if I cancel?",
    a: "Your content items and analytics remain accessible for 30 days after cancellation. During this window you can export everything. After 30 days all data is permanently deleted per our privacy policy.",
  },
  {
    category: "Account & Security",
    q: "How do I revoke access to a specific device?",
    a: "Go to Settings → Security → Active Sessions. You will see a list of all devices currently signed in to your account. Click Revoke next to any session you do not recognize.",
  },
  {
    category: "Account & Security",
    q: "Is my YouTube channel data stored securely?",
    a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). OAuth tokens are stored encrypted and never exposed to client-side code. We do not share your data with third parties.",
  },
  {
    category: "Account & Security",
    q: "How do I permanently delete my account?",
    a: "Go to Settings → Security → Delete Account. You will be asked to confirm the action by typing DELETE. This permanently removes all your channels, content, and personal data. This action cannot be undone.",
  },
];

const MOCK_TICKETS: MockTicket[] = [
  {
    id: "t1",
    subject: "Video not publishing after approval",
    priority: "HIGH",
    status: "IN_PROGRESS",
    createdAt: "2026-08-28T10:00:00Z",
    _count: { messages: 3 },
  },
  {
    id: "t2",
    subject: "How to change my content tone settings?",
    priority: "NORMAL",
    status: "RESOLVED",
    createdAt: "2026-08-20T09:00:00Z",
    _count: { messages: 5 },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-green-50 text-green-700 border-green-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_ON_CLIENT: "bg-gold-50 text-gold-700 border-gold-100",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-paper-low text-ink-mute border-line",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  LOW: "bg-paper-low text-ink-mute",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-red-50 text-red-700",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-line rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-paper-high hover:bg-paper transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-ink">{item.q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-ink-faint shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ink-faint shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-paper-high border-t border-paper-low">
          <p className="text-sm text-ink-soft leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const t = useTranslations("support");

  // FAQ state
  const [faqSearch, setFaqSearch] = useState("");

  // Ticket state
  const [tickets, setTickets] = useState<MockTicket[]>(MOCK_TICKETS);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>("NORMAL");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filtered FAQs
  const filteredFaq = useMemo(() => {
    const q = faqSearch.toLowerCase().trim();
    if (!q) return FAQ_DATA;
    return FAQ_DATA.filter(
      (item) =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  const faqCategories = useMemo(() => {
    const cats = new Map<string, FaqItem[]>();
    for (const item of filteredFaq) {
      if (!cats.has(item.category)) cats.set(item.category, []);
      cats.get(item.category)!.push(item);
    }
    return cats;
  }, [filteredFaq]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject,
          description: ticketDescription,
          priority: ticketPriority,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTickets((prev) => [
          { ...created, _count: { messages: 1 } },
          ...prev,
        ]);
        setTicketSubject("");
        setTicketDescription("");
        setTicketPriority("NORMAL");
        setShowNewTicket(false);
        showToast("success", t("tickets.submitSuccess"));
      } else {
        showToast("error", t("tickets.submitError"));
      }
    } catch {
      showToast("error", t("tickets.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="text-ink-mute mt-1">{t("subtitle")}</p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-soft-lg text-sm font-medium animate-slide-up",
            toast.type === "success"
              ? "bg-green-500 text-paper-high"
              : "bg-red-500 text-paper-high"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* ── FAQ Section ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>{t("faq.title")}</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
              <input
                type="search"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder={t("faq.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-line bg-paper text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {faqCategories.size === 0 ? (
            <div className="py-10 text-center">
              <Search className="h-10 w-10 text-line-strong mx-auto mb-3" />
              <p className="text-ink-mute text-sm">{t("faq.noResults")}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Array.from(faqCategories.entries()).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-3">
                    {t(`faq.categories.${category}` as never) ?? category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <FaqAccordionItem key={i} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tickets Section ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("tickets.title")}</CardTitle>
              <p className="text-sm text-ink-mute mt-1">{t("tickets.subtitle")}</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowNewTicket(true)}>
              <Plus className="h-4 w-4" />
              {t("tickets.openNew")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* New ticket form */}
          {showNewTicket && (
            <form
              onSubmit={handleSubmitTicket}
              className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 space-y-4"
            >
              <h3 className="text-sm font-semibold text-green-800">
                {t("tickets.openNew")}
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-soft">
                  {t("tickets.subject")}
                </label>
                <Input
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder={t("tickets.subjectPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-soft">
                  {t("tickets.description")}
                </label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder={t("tickets.descriptionPlaceholder")}
                  rows={4}
                  required
                  className="w-full rounded-xl border border-line bg-paper-high px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-soft">
                  {t("tickets.priority")}
                </label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                  className="rounded-xl border border-line bg-paper-high px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {(["LOW", "NORMAL", "HIGH", "URGENT"] as TicketPriority[]).map(
                    (p) => (
                      <option key={p} value={p}>
                        {t(`tickets.priorities.${p}` as never)}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? t("tickets.submitting") : t("tickets.submit")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewTicket(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Ticket list */}
          {tickets.length === 0 ? (
            <div className="py-12 text-center">
              <Ticket className="h-12 w-12 text-line-strong mx-auto mb-3" />
              <p className="font-medium text-ink-soft">{t("tickets.empty")}</p>
              <p className="text-sm text-ink-faint mt-1">{t("tickets.emptyDesc")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-4 rounded-xl border border-line bg-paper-high p-4 hover:border-green-200 hover:shadow-soft transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLES[ticket.status]
                        )}
                      >
                        {t(`tickets.statuses.${ticket.status}` as never)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          PRIORITY_STYLES[ticket.priority]
                        )}
                      >
                        {t(`tickets.priorities.${ticket.priority}` as never)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-ink-faint">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {ticket._count.messages} {t("tickets.messages")}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-ink-faint" suppressHydrationWarning>
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Link href={`/support/${ticket.id}`}>
                    <Button variant="ghost" size="sm">
                      {t("tickets.view")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
