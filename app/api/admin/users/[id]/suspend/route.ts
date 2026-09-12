import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { writeAuditLog } from '@/lib/services/audit';
import { setUserStatus } from '@/lib/admin/data';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = id;

  const body = await request.json().catch(() => ({}));
  const action = body.action as 'suspend' | 'reactivate';

  if (action !== 'suspend' && action !== 'reactivate') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';

  const user = await setUserStatus(userId, newStatus);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await writeAuditLog({
    action: action === 'suspend' ? 'admin.user_suspended' : 'admin.user_reactivated',
    actorId: session.userId,
    actorRole: 'admin',
    targetUserId: userId,
    metadata: { targetEmail: user.email, action },
  });

  return NextResponse.json({
    success: true,
    status: newStatus,
    message:
      action === 'suspend'
        ? 'تم إيقاف الحساب بنجاح.'
        : 'تمت إعادة تفعيل الحساب بنجاح.',
  });
}
