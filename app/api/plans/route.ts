import { NextResponse } from 'next/server';
import { getActivePlans } from '@/lib/admin/data';

/**
 * Public plans endpoint — the pricing page and checkout read live plan
 * names and prices (editable by the owner from the admin panel).
 */
export async function GET() {
  const plans = await getActivePlans();
  return NextResponse.json({ plans });
}
