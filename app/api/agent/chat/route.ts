import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { askDeepSeek } from "@/lib/ai-providers/deepseek";

/**
 * VOVO — the client's channel manager co-pilot.
 *
 * Scope: channel news, performance, and video instructions.
 * Hard boundary: VOVO must never access or modify account settings
 * (password, email, financial data, security settings) — the client does
 * that manually in Settings.
 */
const SYSTEM = [
  'You are "VOVO" — the smart channel manager and personal assistant for the client inside the VOVO Agent AI platform.',
  "Your job: answer questions about the channel's news and performance, and receive the client's feedback on videos",
  "(content notes, corrections, requested changes to a published or scheduled video) and log it for action.",
  "Strict, unbreakable security boundary: you must never access or modify the client's account settings",
  "(password, email, financial data, security settings, payment data).",
  "If the client asks for anything like that, politely refuse and tell them those settings are managed manually from the Settings page.",
  "Rely only on the attached real data and never invent numbers. Answer in English, concisely and practically.",
].join(" ");

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  // Real channel + content context (never mock data).
  let context = "No channels are connected to this account yet.";
  if (process.env.DATABASE_URL) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.email.trim().toLowerCase() },
        select: {
          channels: {
            select: { title: true, subscriberCount: true, videoCount: true, niche: true },
          },
          contentItems: {
            select: { title: true, status: true, scheduledAt: true },
            orderBy: { createdAt: "desc" },
            take: 8,
          },
        },
      });

      if (user) {
        const lines: string[] = [];
        if (user.channels.length > 0) {
          lines.push("Connected channels:");
          user.channels.forEach((c) =>
            lines.push(
              `- ${c.title} | ${c.subscriberCount.toLocaleString()} subscribers | ${c.videoCount} videos | niche: ${c.niche || "not set"}`
            )
          );
        } else {
          lines.push("Connected channels: none");
        }
        if (user.contentItems.length > 0) {
          lines.push("", "Latest content items:");
          user.contentItems.forEach((c) =>
            lines.push(
              `- ${c.title} | status: ${c.status}${c.scheduledAt ? ` | scheduled: ${c.scheduledAt.toISOString().slice(0, 10)}` : ""}`
            )
          );
        }
        context = lines.join("\n");
      }
    } catch (err) {
      console.warn("[agent/chat] context load failed:", err);
    }
  }

  try {
    const reply = await askDeepSeek({
      system: SYSTEM,
      user: `Real channel data:\n${context}\n\nClient message:\n${message}`,
      maxTokens: 600,
      temperature: 0.5,
    });
    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    if (detail === "DEEPSEEK_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "VOVO is not configured yet.", code: "AI_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    console.error("[agent/chat]", detail);
    return NextResponse.json(
      { error: "VOVO could not answer right now. Please try again." },
      { status: 502 }
    );
  }
}
