import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from '@/lib/services/audit';

const MAX_INSTRUCTIONS = 2000;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: session.userId },
        { email: session.email.toLowerCase() },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      customInstructions: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const hasName = typeof body.name === 'string' && body.name.trim().length > 0;
  const hasInstructions = typeof body.customInstructions === 'string';

  if (!hasName && !hasInstructions) {
    return NextResponse.json(
      { error: 'Provide a name or custom instructions to update.' },
      { status: 400 }
    );
  }

  if (hasInstructions && body.customInstructions.length > MAX_INSTRUCTIONS) {
    return NextResponse.json(
      { error: `Instructions are too long (max ${MAX_INSTRUCTIONS} characters).` },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { id: session.userId },
        { email: session.email.toLowerCase() },
      ],
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data: { name?: string; customInstructions?: string } = {};
  if (hasName) data.name = body.name.trim();
  if (hasInstructions) data.customInstructions = body.customInstructions.trim();

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      customInstructions: true,
    },
  });

  await writeAuditLog({
    action: 'account.updated',
    actorId: existing.id,
    targetUserId: existing.id,
    metadata: { fields: Object.keys(data) },
  });

  return NextResponse.json(updated);
}
