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
    label: active ? 'الحارس الأمني نشط ويراقب' : 'الحارس الأمني متوقف (بانتظار مفتاح AI)',
  });
}
