import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/** Returns the signed-in user's real invoices (empty list when there is no billing history). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ invoices: [] });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.userId },
          { email: session.email.trim().toLowerCase() },
        ],
      },
      select: { id: true },
    });

    if (!user) return NextResponse.json({ invoices: [] });

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amountCents: true,
        currency: true,
        status: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("[billing/invoices]", error);
    return NextResponse.json({ invoices: [] });
  }
}
