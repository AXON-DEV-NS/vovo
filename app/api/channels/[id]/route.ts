import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";

/** Disconnects (deletes) a channel owned by the signed-in user. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channel = await prisma.channel.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, title: true },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }

  await prisma.channel.delete({ where: { id: channel.id } });

  await writeAuditLog({
    action: "channel.disconnected",
    actorId: session.userId,
    targetUserId: session.userId,
    metadata: { channelId: channel.id, title: channel.title },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true });
}
