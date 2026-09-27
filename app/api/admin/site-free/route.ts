import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { grantFreeAccess } from '@/lib/admin/data';

/**
 * Free access — for everyone (userId omitted) or a specific user, with a
 * configurable duration. Owner only.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === 'string' && body.userId ? body.userId : null;
  const planId = typeof body.planId === 'string' ? body.planId : null;
  const durationDays = Number(body.durationDays) || 1;

  const grant = await grantFreeAccess({ userId, planId, durationDays });

  return NextResponse.json({ ok: true, grant });
}
