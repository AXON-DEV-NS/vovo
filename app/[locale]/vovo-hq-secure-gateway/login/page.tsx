"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Lock, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !code) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(
          data.error === "Owner access is not configured."
            ? "الوصول غير مُفعَّل. شغِّل بيانات المسؤول أولًا."
            : "بيانات الاعتماد غير صحيحة."
        );
        return;
      }

      router.push(data.redirect || "/vovo-hq-secure-gateway/overview");
      router.refresh();
    } catch {
      setError("حدث خطأ ما. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-screen items-center justify-center bg-ink p-4"
      style={{ fontFamily: "var(--font-arabic, 'Noto Sans Arabic', sans-serif)" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-paper-high font-bold text-lg">
            HQ
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-paper-high">
            دخول المالك
          </h1>
          <p className="mt-2 text-sm text-ink-faint">
            مطلوب كلمة المرور ورمز التحقق الثنائي.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-ink-soft bg-ink-soft p-6 shadow-card"
        >
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm leading-relaxed text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-line-strong"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-md border border-ink-soft bg-ink px-4 pr-10 text-sm text-paper-high placeholder:text-ink-mute focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  required
                />
                <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-code"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-line-strong"
              >
                رمز التحقق الثنائي
              </label>
              <input
                id="admin-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                autoComplete="one-time-code"
                className="h-11 w-full rounded-md border border-ink-soft bg-ink px-4 font-mono text-lg tracking-[0.4em] text-paper-high placeholder:text-ink-mute focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                required
              />
              <p className="mt-2 text-[11px] text-ink-mute">
                أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة على هاتفك (Google Authenticator).
              </p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ التحقق…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                تسجيل الدخول
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-mute">
          جميع محاولات الدخول تُسجَّل.
        </p>
      </div>
    </div>
  );
}
