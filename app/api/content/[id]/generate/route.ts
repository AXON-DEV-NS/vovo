import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkUserAccess } from "@/lib/billing/subscription-service";
import { advanceContentItemPipeline } from "@/lib/services/content";

/**
 * Advances one content item through the AI production pipeline:
 * IDEA → SCRIPT (DeepSeek brain + niche memory) and then
 * SCRIPT/GENERATING → READY_FOR_REVIEW (Higgsfield assets).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await checkUserAccess(session.userId, session.email);
  if (!access.hasAccess) {
    return NextResponse.json(
      {
        error: "Subscription Required",
        code: "SUBSCRIPTION_REQUIRED",
        message: access.message || "Please subscribe to a plan to start AI production.",
      },
      { status: 402 }
    );
  }

  try {
    const item = await advanceContentItemPipeline(id, session.userId);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }
    if (message === "DEEPSEEK_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "AI brain is not configured.", code: "AI_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    if (message.startsWith("COMPLIANCE_REJECTED")) {
      return NextResponse.json(
        {
          error: "YouTube compliance rejected this content.",
          code: "COMPLIANCE_REJECTED",
          details: message.replace("COMPLIANCE_REJECTED:", "").trim(),
        },
        { status: 422 }
      );
    }
    if (message === "COMPLIANCE_REQUIRED") {
      return NextResponse.json(
        {
          error: "Compliance approval is required before producing assets.",
          code: "COMPLIANCE_REQUIRED",
        },
        { status: 422 }
      );
    }
    if (message.startsWith("DEEPSEEK_")) {
      console.error("[content/generate]", message);
      return NextResponse.json(
        { error: "AI generation failed. Please try again.", code: "AI_FAILED" },
        { status: 502 }
      );
    }

    console.error("[content/generate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
