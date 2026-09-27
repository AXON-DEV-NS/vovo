import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from '@/lib/services/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ensure the session belongs to the current user
  const target = await prisma.session.findFirst({
    where: { id, userId: session.userId },
  });

  if (!target) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });

  await prisma.session.delete({ where: { id } });

  await writeAuditLog({
    action: 'session.revoked',
    actorId: session.userId,
    targetUserId: session.userId,
    metadata: { revokedSessionId: id },
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  });

  return NextResponse.json({ success: true });
}
