import { NextRequest, NextResponse } from 'next/server';
import { validatePromoCode } from '@/lib/admin/data';
import { checkRateLimit } from '@/lib/security/guardian';

/**
 * Validate (and apply) a promo code at checkout.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  const rate = await checkRateLimit(`promo_${ip}`, 10, 60000);
  if (!rate.allowed) {
    return NextResponse.json(
      { valid: false, message: 'Too many attempts. Please try again shortly.' },
      { status: 429 }
    );
  }

  const { code } = await request.json().catch(() => ({}));
  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { valid: false, message: 'أدخل كود الخصم.' },
      { status: 400 }
    );
  }

  const result = await validatePromoCode(code);
  return NextResponse.json(result);
}
