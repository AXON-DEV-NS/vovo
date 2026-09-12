"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { getPlan, getPlanPrice, TRIAL_DAYS } from "@/lib/plans";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";

type Status = "idle" | "processing" | "success" | "error";

type Fields = {
  name: string;
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function luhnCheck(num: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function validateField(field: keyof Fields, value: string): string | null {
  switch (field) {
    case "name":
      return value.trim().length >= 2 ? null : "Enter your full name.";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        ? null
        : "Enter a valid email address.";
    case "cardNumber": {
      const digits = value.replace(/\s+/g, "");
      if (digits.length < 13) return "Card number is incomplete.";
      if (!luhnCheck(digits)) return "This card number isn't valid.";
      return null;
    }
    case "expiry": {
      const digits = value.replace(/\D/g, "");
      if (digits.length !== 4) return "Use MM/YY format.";
      const mm = Number(digits.slice(0, 2));
      const yy = Number(digits.slice(2));
      if (mm < 1 || mm > 12) return "Invalid month.";
      const now = new Date();
      if (
        yy < now.getFullYear() % 100 ||
        (yy === now.getFullYear() % 100 && mm < now.getMonth() + 1)
      )
        return "This card has expired.";
      return null;
    }
    case "cvc":
      return /^\d{3,4}$/.test(value) ? null : "3–4 digit code.";
    default:
      return null;
  }
}

function Progress({ status }: { status: Status }) {
  const steps = [
    { label: "Plan", done: true },
    { label: "Payment", active: status !== "success", done: status === "success" },
    { label: "Done", done: status === "success" },
  ];
  return (
    <div className="mb-10 flex items-center gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                step.done
                  ? "bg-green-600 text-paper-high"
                  : step.active
                    ? "bg-ink text-paper-high"
                    : "bg-paper-low text-ink-faint"
              )}
            >
              {step.done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                step.done || step.active ? "text-ink" : "text-ink-faint"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="h-px w-6 bg-line-strong" />}
        </div>
      ))}
    </div>
  );
}

function FieldShell({
  label,
  error,
  children,
}: {
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function inputClasses(hasError: boolean) {
  return cn(
    "flex h-11 w-full rounded-md border bg-paper-high px-4 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20",
    hasError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-line focus:border-green-500"
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = getPlan(searchParams.get("plan"));
  const billing =
    searchParams.get("billing") === "yearly" ? "yearly" : "monthly";
  const price = getPlanPrice(plan, billing);

  const [fields, setFields] = useState<Fields>({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string | null>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<{ discountType: string; discountValue: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  function applyDiscount(base: number): number {
    if (!promo) return base;
    if (promo.discountType === "percent") {
      return Math.max(0, Math.round(base * (1 - promo.discountValue / 100)));
    }
    return Math.max(0, base - promo.discountValue);
  }
  const finalPrice = applyDiscount(price);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoChecking(true);
    setPromoError(null);
    setPromoMessage(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (data.valid && data.promo) {
        setPromo(data.promo);
        setPromoMessage(
          `تم تطبيق الكود — خصم ${
            data.promo.discountType === "percent"
              ? `${data.promo.discountValue}%`
              : `$${data.promo.discountValue}`
          }.`
        );
      } else {
        setPromo(null);
        setPromoError(data.message || "كود غير صالح");
      }
    } catch {
      setPromoError("تعذّر التحقق من الكود.");
    } finally {
      setPromoChecking(false);
    }
  }

  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const trialEndLabel = trialEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  function update(field: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  }

  function blur(field: keyof Fields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, fields[field]),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const all: (keyof Fields)[] = ["name", "email", "cardNumber", "expiry", "cvc"];
    setTouched(Object.fromEntries(all.map((f) => [f, true])));
    const nextErrors: Partial<Record<keyof Fields, string | null>> = {};
    for (const f of all) {
      nextErrors[f] = validateField(f, fields[f]);
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setStatus("processing");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, billing, ...fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setApiError(
          data.error?.message || "Payment failed. Please try again."
        );
      }
    } catch {
      setStatus("error");
      setApiError(
        "We couldn't reach the payment service. Check your connection and try again — your details are saved."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          <h1 className="display text-display-md">You&apos;re subscribed.</h1>
          <p className="mt-4 text-ink-mute">
            Your <span className="font-medium text-ink">{plan.name}</span> plan
            is active. We sent a receipt and account setup link to{" "}
            <span className="font-medium text-ink">{fields.email}</span>.
          </p>

          <div className="mt-8 rounded-lg border border-line bg-paper-high p-6 text-left">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className="text-sm text-ink-mute">{plan.name} plan</span>
              <span className="text-sm font-medium text-ink">
                {billing === "yearly" ? "Yearly" : "Monthly"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-line py-4">
              <span className="text-sm text-ink-mute">Price</span>
              <span className="text-sm font-medium text-ink">
                ${price}/{billing === "yearly" ? "year" : "month"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-line py-4">
              <span className="text-sm text-ink-mute">Free trial</span>
              <span className="text-sm font-medium text-green-700">
                {TRIAL_DAYS} days — starts today
              </span>
            </div>
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm font-medium text-ink">Due today</span>
              <span className="font-display text-lg font-semibold text-ink">
                $0.00
              </span>
            </div>
          </div>

          <p className="mt-6 text-xs text-ink-faint">
            You won&apos;t be charged until {trialEndLabel}. Cancel anytime in
            settings — no questions asked.
          </p>

          <Link href="/onboarding" className="mt-8 inline-block">
            <Button variant="primary" size="lg">
              Continue setup — connect your channel
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Progress status={status} />

      <div className="grid gap-10 lg:grid-cols-5">
        {/* ===== Order summary ===== */}
        <aside className="lg:col-span-2">
          <div className="rounded-lg border border-line bg-paper-high p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Order summary
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {plan.name}
              </h2>
              <span className="text-sm text-ink-mute">
                {billing === "yearly" ? "Yearly" : "Monthly"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-mute">
              {plan.desc}
            </p>

            <div className="mt-6 border-t border-line pt-5">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold text-ink">
                  ${promo ? finalPrice : price}
                </span>
                <span className="text-ink-mute">
                  /{billing === "yearly" ? "year" : "month"}
                </span>
                {promo && (
                  <span className="text-sm text-ink-faint line-through">
                    ${price}
                  </span>
                )}
              </div>
              {promo && (
                <p className="mt-1 text-xs font-medium text-green-700">
                  {promoMessage}
                </p>
              )}
              <div className="mt-5 space-y-3 border-t border-line pt-5">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-sm text-ink-soft">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo code */}
            <div className="mt-5 border-t border-line pt-5">
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">
                كود الخصم
              </label>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME20"
                  className="flex h-10 flex-1 rounded-md border border-line bg-paper-high px-3 text-sm uppercase placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={promoChecking || !promoCode.trim()}
                  onClick={applyPromo}
                >
                  {promoChecking ? "..." : "تطبيق"}
                </Button>
              </div>
              {promoError && (
                <p className="mt-1.5 text-xs text-red-600">{promoError}</p>
              )}
            </div>

            <div className="mt-6 rounded-md bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-800">
                {TRIAL_DAYS}-day free trial
              </p>
              <p className="mt-1 text-xs leading-relaxed text-green-700">
                Due today: <span className="font-semibold">$0.00</span>. You
                won&apos;t be charged until {trialEndLabel}. Cancel anytime.
              </p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Change plan
          </Link>
        </aside>

        {/* ===== Payment form ===== */}
        <section className="lg:col-span-3">
          <form onSubmit={handleSubmit} noValidate>
            <div className="rounded-lg border border-line bg-paper-high p-6 sm:p-8">
              <h1 className="display text-2xl font-semibold text-ink">
                Complete your subscription
              </h1>
              <p className="mt-2 text-sm text-ink-mute">
                Two minutes to set up. Your card is only charged after the free
                trial.
              </p>

              {status === "error" && apiError && (
                <div
                  className="mt-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Payment didn&apos;t go through
                    </p>
                    <p className="mt-0.5 text-sm text-red-700">{apiError}</p>
                  </div>
                </div>
              )}

              <div className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldShell label="Full name" error={errors.name || null}>
                    <input
                      className={inputClasses(!!errors.name)}
                      value={fields.name}
                      onChange={(e) => update("name", e.target.value)}
                      onBlur={() => blur("name")}
                      placeholder="Jane Smith"
                      autoComplete="name"
                      inputMode="text"
                    />
                  </FieldShell>
                  <FieldShell label="Email" error={errors.email || null}>
                    <input
                      type="email"
                      className={inputClasses(!!errors.email)}
                      value={fields.email}
                      onChange={(e) => update("email", e.target.value)}
                      onBlur={() => blur("email")}
                      placeholder="jane@example.com"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </FieldShell>
                </div>

                <div>
                  <FieldShell label="Card number" error={errors.cardNumber || null}>
                    <div className="relative">
                      <input
                        className={cn(inputClasses(!!errors.cardNumber), "pr-10")}
                        value={fields.cardNumber}
                        onChange={(e) =>
                          update("cardNumber", formatCardNumber(e.target.value))
                        }
                        onBlur={() => blur("cardNumber")}
                        placeholder="4242 4242 4242 4242"
                        autoComplete="cc-number"
                        inputMode="numeric"
                      />
                      <CreditCard className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    </div>
                  </FieldShell>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldShell label="Expiry (MM/YY)" error={errors.expiry || null}>
                    <input
                      className={inputClasses(!!errors.expiry)}
                      value={fields.expiry}
                      onChange={(e) => update("expiry", formatExpiry(e.target.value))}
                      onBlur={() => blur("expiry")}
                      placeholder="12/28"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                    />
                  </FieldShell>
                  <FieldShell label="Security code" error={errors.cvc || null}>
                    <input
                      className={inputClasses(!!errors.cvc)}
                      value={fields.cvc}
                      onChange={(e) =>
                        update("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      onBlur={() => blur("cvc")}
                      placeholder="123"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                    />
                  </FieldShell>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-8 w-full"
                disabled={status === "processing"}
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Start {TRIAL_DAYS}-day free trial — $0 today
                  </>
                )}
              </Button>

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-ink-faint">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Encrypted with 256-bit TLS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {["Visa", "Mastercard", "Amex", "Discover"].map((brand) => (
                    <span
                      key={brand}
                      className="rounded border border-line bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-mute"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-ink-faint leading-relaxed">
                Cancel anytime before {trialEndLabel} and you won&apos;t be
                charged. By starting your trial, you agree to our{" "}
                <Link href="/legal/terms" className="underline hover:text-ink">
                  Terms
                </Link>
                ,{" "}
                <Link href="/legal/refund" className="underline hover:text-ink">
                  14-Day Refund Guarantee
                </Link>
                , and{" "}
                <Link href="/legal/cancellation" className="underline hover:text-ink">
                  Cancellation Policy
                </Link>
                .
              </p>
              <p className="mt-2 text-center text-[11px] text-ink-faint">
                Demo mode — use 4242 4242 4242 4242 to succeed, or 4000 0000
                0000 0002 to see a declined card.
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
