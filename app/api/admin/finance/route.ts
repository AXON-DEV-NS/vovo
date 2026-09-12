import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { getFinance } from '@/lib/admin/data';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getFinance();
  return NextResponse.json(data);
}
