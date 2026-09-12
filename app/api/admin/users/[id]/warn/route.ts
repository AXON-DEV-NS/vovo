import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { sendWarning } from '@/lib/admin/data';

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
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return NextResponse.json({ error: 'نص التحذير مطلوب' }, { status: 400 });
  }

  const notice = await sendWarning(id, message);
  if (!notice) {
    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, notice });
}
