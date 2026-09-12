"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ChatMessage {
  role: "user" | "vovo";
  text: string;
}

const GREETING: ChatMessage = {
  role: "vovo",
  text: "أهلاً! أنا VOVO — مدير قناتك الذكي. اسألني عن أداء القناة، أو أرسل ملاحظاتك على أي فيديو (منشور أو مجدول) وسأوثّقها للتنفيذ. ملاحظة: إعدادات حسابك (كلمة المرور، البريد، الدفع) تُدار يدويًا من صفحة الإعدادات فقط.",
};

/**
 * VOVO — the floating channel-manager assistant.
 * Brand colors only: paper / ink / green / gold.
 */
export function VovoAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages((prev) => [
        ...prev,
        {
          role: "vovo",
          text: res.ok && data.reply ? data.reply : data.error || "تعذّر الرد حاليًا. حاول مجددًا.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "vovo", text: "تعذّر الاتصال. تحقق من الشبكة وحاول مجددًا." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open VOVO assistant"
        className={cn(
          "fixed bottom-6 right-6 z-[60] flex h-13 w-13 items-center justify-center rounded-full shadow-card transition-transform active:scale-95",
          open ? "bg-ink text-paper-high" : "bg-green-600 text-paper-high hover:bg-green-700"
        )}
        style={{ height: "3.25rem", width: "3.25rem" }}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] flex h-[30rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-line bg-paper-high shadow-card">
          <div className="flex items-center gap-2.5 border-b border-line bg-ink px-4 py-3 text-paper-high">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 font-display text-sm font-bold">
              V
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">VOVO</p>
              <p className="text-[10px] uppercase tracking-wider text-paper/50">
                Channel manager
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 text-green-300" aria-label="Account settings are off-limits" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-paper px-3 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-ink text-paper-high"
                    : "mr-auto border border-line bg-paper-high text-ink-soft"
                )}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-xl border border-line bg-paper-high px-3 py-2 text-xs text-ink-mute">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> VOVO يكتب...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line bg-paper-high p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="اكتب رسالتك لـ VOVO..."
                className="h-10 flex-1 rounded-lg border border-line bg-paper px-3 text-xs text-ink placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                dir="rtl"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-paper-high transition-colors hover:bg-green-700 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-faint">
              VOVO لا يصل إلى إعدادات حسابك أو بيانات الدفع — هذه تُدار يدويًا فقط.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
