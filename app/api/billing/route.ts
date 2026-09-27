import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.userId },
    }),
    prisma.invoice.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 24,
    }),
  ]);

  return NextResponse.json({ subscription, invoices });
}
