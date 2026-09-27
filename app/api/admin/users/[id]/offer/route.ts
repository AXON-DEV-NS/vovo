import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { grantFreeAccess } from '@/lib/admin/data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const planId = typeof body.planId === 'string' ? body.planId : null;
  const durationDays = Number(body.durationDays) || 30;

  const grant = await grantFreeAccess({
    userId: id,
    planId,
    durationDays,
  });

  return NextResponse.json({ ok: true, grant });
}
