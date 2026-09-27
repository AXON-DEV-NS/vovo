import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { hasConfiguredAiKey } from '@/lib/admin/data';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const active = hasConfiguredAiKey();
  return NextResponse.json({
    active,
    label: active ? 'Security guardian active & monitoring' : 'Security guardian offline (waiting for AI key)',
  });
}
