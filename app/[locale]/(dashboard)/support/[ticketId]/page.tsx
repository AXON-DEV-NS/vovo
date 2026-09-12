"use client";

import { useState, useEffect, useRef, use } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_ON_CLIENT"
  | "RESOLVED"
  | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
  userId: string | null;
}

interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  messages: TicketMessage[];
}

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

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicketThreadPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = use(params);
  const t = useTranslations("support");
  const bottomRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/support/tickets/${ticketId}`);
        if (res.ok) {
          const data = await res.json();
          setTicket(data);
        } else {
          // Real data only — no mock fallback.
          setTicket(null);
        }
      } catch {
        setTicket(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages load or new ones arrive
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !ticket) return;
    setSending(true);
    const content = reply.trim();
    setReply("");

    // Optimistic update
    const optimistic: TicketMessage = {
      id: `opt-${Date.now()}`,
      content,
      isStaff: false,
      userId: "me",
      createdAt: new Date().toISOString(),
    };
    setTicket((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev
    );

    try {
      const res = await fetch(
        `/api/support/tickets/${ticketId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      if (res.ok) {
        const saved = await res.json();
        // Replace optimistic with real
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === optimistic.id ? saved : m
                ),
              }
            : prev
        );
        showToast("success", t("thread.replySuccess"));
      } else {
        // Rollback optimistic
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== optimistic.id),
              }
            : prev
        );
        setReply(content);
        showToast("error", t("thread.replyError"));
      }
    } catch {
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter((m) => m.id !== optimistic.id),
            }
          : prev
      );
      setReply(content);
      showToast("error", t("thread.replyError"));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-mute">Ticket not found.</p>
        <Link href="/support">
          <Button variant="secondary" size="sm" className="mt-4">
            {t("thread.backToTickets")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
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

      {/* Back + Header */}
      <div>
        <Link href="/support">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            {t("thread.backToTickets")}
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-ink">{ticket.subject}</h1>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                STATUS_STYLES[ticket.status]
              )}
            >
              {t(`tickets.statuses.${ticket.status}` as never)}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                PRIORITY_STYLES[ticket.priority]
              )}
            >
              {t(`tickets.priorities.${ticket.priority}` as never)}
            </span>
          </div>
        </div>
      </div>

      {/* Message thread */}
      <div className="rounded-2xl border border-line bg-paper-high overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {ticket.messages.map((message) => {
            const isClient = !message.isStaff;
            return (
              <div
                key={message.id}
                className={cn("flex flex-col gap-1", isClient && "items-end")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isClient
                      ? "bg-green-600 text-paper-high rounded-br-sm"
                      : "bg-paper-low text-ink rounded-bl-sm"
                  )}
                >
                  <p>{message.content}</p>
                </div>
                <span className="text-xs text-ink-faint px-1" suppressHydrationWarning>
                  {isClient ? t("thread.you") : t("thread.supportTeam")} Â·{" "}
                  {formatTime(message.createdAt)}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply form */}
        {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
          <form
            onSubmit={handleSendReply}
            className="border-t border-line p-4 flex items-end gap-3"
          >
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t("thread.replyPlaceholder")}
              rows={2}
              className="flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply(e);
                }
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={sending || !reply.trim()}
              className="shrink-0"
              aria-label={t("thread.sendReply")}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}

        {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
          <div className="border-t border-line p-4 text-center text-sm text-ink-faint">
            This ticket is {ticket.status.toLowerCase()}. Open a new ticket if you need further assistance.
          </div>
        )}
      </div>
    </div>
  );
}
