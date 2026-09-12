import { NextResponse } from 'next/server';
import { deleteAdminSession, getAdminSession } from '@/lib/auth/admin-session';
import { writeAuditLog } from '@/lib/services/audit';

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    await writeAuditLog({
      action: 'admin.logout' as any,
      actorId: session.userId,
      actorRole: 'admin',
      metadata: { email: session.email },
    });
  }

  await deleteAdminSession();
  return NextResponse.json({ success: true });
}
