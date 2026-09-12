import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { deletePromoCode, togglePromoCode } from '@/lib/admin/data';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ok = await deletePromoCode(id);
  if (!ok) {
    return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const active = Boolean(body.active);
  const ok = await togglePromoCode(id, active);
  if (!ok) {
    return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
