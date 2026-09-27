import { usingDatabase, getUserRecord, getActiveFreeGrant, getAutoTrialSetting } from "@/lib/admin/data";
import { prisma } from "@/lib/db/prisma";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

export interface UserAccessStatus {
  hasAccess: boolean;
  status: "ACTIVE" | "TRIALING" | "EVENT" | "LOCKED";
  reason: "ACTIVE_SUBSCRIPTION" | "TRIAL_ACTIVE" | "EVENT_ACTIVE" | "NO_SUBSCRIPTION";
  planId: string | null;
  planName: string | null;
  daysRemaining?: number;
  expiresAt?: string;
  message: string;
}

/**
 * Checks whether the specified user currently has authorization to run the
 * autonomous AI channel engine (script generation, video scheduling, research).
 *
 * Evaluation Hierarchy:
 * 1. Owner Admin email -> Always full unlimited access
 * 2. Database subscription -> Active / Trialing
 * 3. In-memory / dev store subscription -> Active
 * 4. Active Promotional Event / Free Access Grant (site-wide or user-specific)
 * 5. Active 14-day Free Trial (if auto-trial enabled by owner)
 * 6. Explicit trialing status in user record
 * 7. Default -> LOCKED (402 Subscription Required)
 */
export async function checkUserAccess(userId: string, email: string): Promise<UserAccessStatus> {
  const cleanEmail = (email || "").trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "oren.on.oren.25@gmail.com").trim().toLowerCase();

  // 1. Owner Admin always has full access
  if (cleanEmail === adminEmail) {
    return {
      hasAccess: true,
      status: "ACTIVE",
      reason: "ACTIVE_SUBSCRIPTION",
      planId: "agency",
      planName: "Agency (Owner)",
      message: "Unlimited owner access",
    };
  }

  // 2. Database evaluation (if PostgreSQL is connected)
  if (usingDatabase()) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { subscription: true },
      });

      if (user?.subscription && user.subscription.status === "ACTIVE") {
        const plan = PLANS.find((p) => p.id.toUpperCase() === user.subscription!.plan) || PLANS[0];
        return {
          hasAccess: true,
          status: "ACTIVE",
          reason: "ACTIVE_SUBSCRIPTION",
          planId: plan.id,
          planName: plan.name,
          expiresAt: user.subscription.currentPeriodEnd.toISOString(),
          message: `Subscription active — ${plan.name} plan`,
        };
      }

      if (user?.subscription && user.subscription.status === "TRIALING") {
        const now = Date.now();
        const end = new Date(user.subscription.currentPeriodEnd).getTime();
        const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
        if (daysRemaining > 0) {
          return {
            hasAccess: true,
            status: "TRIALING",
            reason: "TRIAL_ACTIVE",
            planId: user.subscription.plan.toLowerCase(),
            planName: user.subscription.plan,
            daysRemaining,
            expiresAt: user.subscription.currentPeriodEnd.toISOString(),
            message: `Trial active (${daysRemaining} days remaining)`,
          };
        }
      }
    } catch (e) {
      console.error("[checkUserAccess] database check error:", e);
    }
  }

  // 3. In-memory / dev store evaluation
  const userRecord = await getUserRecord(cleanEmail || userId);

  // 3a. User has active paid subscription
  if (userRecord?.subscription && userRecord.subscription.status === "ACTIVE") {
    const pId = userRecord.subscription.plan.toLowerCase();
    const plan = PLANS.find((p) => p.id === pId) || PLANS[0];
    return {
      hasAccess: true,
      status: "ACTIVE",
      reason: "ACTIVE_SUBSCRIPTION",
      planId: plan.id,
      planName: plan.name,
      message: `Subscription active — ${plan.name} plan`,
    };
  }

  // 3b. Check active promotional event / free grant (site-wide or user-specific)
  const activeGrant = await getActiveFreeGrant(cleanEmail || userId);
  if (activeGrant) {
    const now = Date.now();
    const end = new Date(activeGrant.expiresAt).getTime();
    const hoursRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60)));
    const daysRemaining = Math.ceil(hoursRemaining / 24);
    const planName = activeGrant.planId ? activeGrant.planId.toUpperCase() : "Full access";
    return {
      hasAccess: true,
      status: "EVENT",
      reason: "EVENT_ACTIVE",
      planId: activeGrant.planId || "growth",
      planName,
      daysRemaining,
      expiresAt: activeGrant.expiresAt,
      message: `🎉 Promo event active — free access available (${
        daysRemaining > 1 ? `${daysRemaining} days` : `${hoursRemaining} hours`
      } remaining)`,
    };
  }

  // 3c. Auto Free Trial check (if enabled by admin)
  const autoTrial = await getAutoTrialSetting();
  if (autoTrial && userRecord?.createdAt) {
    const signupTime = new Date(userRecord.createdAt).getTime();
    const trialDuration = TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - signupTime < trialDuration) {
      const daysRemaining = Math.max(1, Math.ceil((trialDuration - (now - signupTime)) / (1000 * 60 * 60 * 24)));
      return {
        hasAccess: true,
        status: "TRIALING",
        reason: "TRIAL_ACTIVE",
        planId: "starter",
        planName: "Starter (Trial)",
        daysRemaining,
        message: `⚡ Trial active (${daysRemaining} days remaining)`,
      };
    }
  }

  // 3d. User record explicitly flagged as TRIALING
  if (userRecord?.subscription && userRecord.subscription.status === "TRIALING") {
    return {
      hasAccess: true,
      status: "TRIALING",
      reason: "TRIAL_ACTIVE",
      planId: userRecord.subscription.plan.toLowerCase(),
      planName: userRecord.subscription.plan,
      daysRemaining: 14,
      message: `⚡ Trial active (14 days remaining)`,
    };
  }

  // 4. No active subscription, no event, no trial -> Locked
  return {
    hasAccess: false,
    status: "LOCKED",
    reason: "NO_SUBSCRIPTION",
    planId: null,
    planName: null,
    message: "🔒 The AI agent is paused — activate a subscription plan to start production",
  };
}
