import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from '@/lib/services/audit';

/** Cascading account deletion — removes all user data */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.confirm !== true) {
    return NextResponse.json(
      { error: 'Confirmation required. Pass { "confirm": true } in the request body.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: session.userId },
        { email: session.email.toLowerCase() },
      ],
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await writeAuditLog({
    action: 'account.deleted',
    actorId: user.id,
    targetUserId: user.id,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  });

  // Cascade is handled by Prisma onDelete: Cascade on all relations
  await prisma.user.delete({ where: { id: user.id } });

  const response = NextResponse.json({ success: true });
  response.cookies.delete('session');
  return response;
}
