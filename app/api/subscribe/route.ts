import { NextRequest, NextResponse } from "next/server";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";
import { checkRateLimit } from "@/lib/security/guardian";
import { setUserSubscription, usingDatabase } from "@/lib/admin/data";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

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

function fieldError(field: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { message, field, code: "validation_error" } },
    { status: 400 }
  );
}

const DECLINED_TEST_CARDS = ["4000000000000002", "4000000000009995"];

export async function POST(request: NextRequest) {
  // Subscriptions are bound to a verified session — never to a body email.
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { message: "Please sign in first.", code: "unauthorized" } },
      { status: 401 }
    );
  }

  // Protect the subscribe endpoint from automated abuse/card-testing.
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = await checkRateLimit(`subscribe_${ip}`, 6, 60000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: { message: "Too many attempts. Please try again shortly.", code: "rate_limited" } },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "Invalid request.", code: "bad_request" } },
      { status: 400 }
    );
  }

  const planId = typeof body.plan === "string" ? body.plan : "";
  const billing = body.billing === "yearly" ? "yearly" : "monthly";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const cardNumber = typeof body.cardNumber === "string" ? body.cardNumber : "";
  const expiry = typeof body.expiry === "string" ? body.expiry : "";
  const cvc = typeof body.cvc === "string" ? body.cvc : "";

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    return fieldError("plan", "Please choose a valid plan.");
  }

  if (name.length < 2) {
    return fieldError("name", "Please enter your full name.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fieldError("email", "Please enter a valid email address.");
  }

  const digits = cardNumber.replace(/\s+/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return fieldError("cardNumber", "Your card number looks incomplete.");
  }
  if (!luhnCheck(digits)) {
    return fieldError("cardNumber", "This card number isn't valid. Check it and try again.");
  }

  const expiryDigits = expiry.replace(/\D/g, "");
  if (expiryDigits.length !== 4) {
    return fieldError("expiry", "Enter your card's expiry as MM/YY.");
  }
  const mm = Number(expiryDigits.slice(0, 2));
  const yy = Number(expiryDigits.slice(2));
  if (mm < 1 || mm > 12) {
    return fieldError("expiry", "Enter a valid expiry month.");
  }
  const now = new Date();
  const currentYY = now.getFullYear() % 100;
  const currentMM = now.getMonth() + 1;
  if (yy < currentYY || (yy === currentYY && mm < currentMM)) {
    return fieldError("expiry", "This card has expired.");
  }

  if (!/^\d{3,4}$/.test(cvc)) {
    return fieldError("cvc", "Enter the 3–4 digit security code.");
  }

  await new Promise((resolve) => setTimeout(resolve, 1600));

  if (DECLINED_TEST_CARDS.includes(digits)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            "Your card was declined by the bank. Check the details or try a different card.",
          code: "card_declined",
        },
      },
      { status: 402 }
    );
  }

  const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  console.log("[Subscribe] Payment simulated:", {
    plan: plan.name,
    billing,
    price,
    email,
    at: new Date().toISOString(),
  });

  const sessionEmail = session.email.trim().toLowerCase();
  const targetEmail = sessionEmail;

  // 1. Persist subscription in store
  if (targetEmail) {
    await setUserSubscription(targetEmail, {
      plan: plan.id.toUpperCase(),
      status: "ACTIVE",
    });
  }

  // 2. Persist in database if active
  if (usingDatabase() && targetEmail) {
    try {
      const user = await prisma.user.findUnique({ where: { email: targetEmail.toLowerCase() } });
      if (user) {
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            plan: plan.id.toUpperCase() as "STARTER" | "GROWTH" | "AGENCY",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
          update: {
            plan: plan.id.toUpperCase() as "STARTER" | "GROWTH" | "AGENCY",
            status: "ACTIVE",
            currentPeriodEnd: periodEnd,
          },
        });
      }
    } catch (e) {
      console.error("[Subscribe] Database subscription save error:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    subscription: {
      plan: plan.name,
      planId: plan.id,
      billing,
      price,
      trialDays: TRIAL_DAYS,
    },
  });
}
