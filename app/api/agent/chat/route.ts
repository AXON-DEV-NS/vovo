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
  'أنت "VOVO" — مدير القناة الذكي والمساعد الشخصي للعميل داخل منصة VOVO Agent AI.',
  "مهمتك: الإجابة عن أخبار القناة وأدائها، وتلقي ملاحظات العميل حول الفيديوهات",
  "(ملاحظات المحتوى، تصحيح الأخطاء، التعديلات المطلوبة على فيديو منشور أو مجدول) وتوثيقها للتنفيذ.",
  "حدود أمنية صارمة لا تُخترق: يُحظر عليك تمامًا الوصول إلى أو تعديل إعدادات حساب العميل",
  "(كلمة المرور، البريد الإلكتروني، البيانات المالية، إعدادات الأمان، بيانات الدفع).",
  "إذا طلب العميل أي شيء من هذا القبيل، ارفض بلطف وأخبره أن هذه الإعدادات تُدار يدويًا من صفحة الإعدادات.",
  "اعتمد فقط على البيانات الحقيقية المرفقة ولا تخترع أرقامًا. أجب بالعربية بإيجاز وعملية.",
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
  let context = "لا توجد قنوات مربوطة بالحساب بعد.";
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
          lines.push("القنوات المربوطة:");
          user.channels.forEach((c) =>
            lines.push(
              `- ${c.title} | ${c.subscriberCount.toLocaleString()} مشترك | ${c.videoCount} فيديو | النيتش: ${c.niche || "غير محدد"}`
            )
          );
        } else {
          lines.push("القنوات المربوطة: لا يوجد");
        }
        if (user.contentItems.length > 0) {
          lines.push("", "أحدث عناصر المحتوى:");
          user.contentItems.forEach((c) =>
            lines.push(
              `- ${c.title} | الحالة: ${c.status}${c.scheduledAt ? ` | مجدول: ${c.scheduledAt.toISOString().slice(0, 10)}` : ""}`
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
      user: `بيانات القناة الحقيقية:\n${context}\n\nرسالة العميل:\n${message}`,
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
