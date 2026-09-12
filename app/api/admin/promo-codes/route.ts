import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createPromoCode, listPromoCodes } from '@/lib/admin/data';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const codes = await listPromoCodes();
  return NextResponse.json({ codes });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { code, discountType, discountValue, expiryDate, maxUses } = body;

  if (!code || !discountType || discountValue == null) {
    return NextResponse.json(
      { error: 'الكود ونوع الخصم وقيمته مطلوبة' },
      { status: 400 }
    );
  }

  if ((discountType !== 'percent' && discountType !== 'fixed') || Number(discountValue) <= 0) {
    return NextResponse.json({ error: 'بيانات الخصم غير صحيحة' }, { status: 400 });
  }

  try {
    const promo = await createPromoCode({
      code,
      discountType,
      discountValue: Number(discountValue),
      expiryDate: expiryDate || null,
      maxUses: maxUses != null ? Number(maxUses) : null,
    });
    return NextResponse.json({ ok: true, promo });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === 'CODE_EXISTS') {
      return NextResponse.json({ error: 'هذا الكود موجود بالفعل' }, { status: 409 });
    }
    return NextResponse.json({ error: 'تعذّر إنشاء الكود' }, { status: 500 });
  }
}
