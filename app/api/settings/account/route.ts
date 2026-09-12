import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from '@/lib/services/audit';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name } = body;

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { name: name.trim() },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });

  await writeAuditLog({
    action: 'content.status_changed', // reuse closest available — Phase 5 adds profile_updated
    actorId: session.userId,
    metadata: { field: 'name' },
  });

  return NextResponse.json(updated);
}
