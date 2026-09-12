import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { getOverview, listContactInquiries } from '@/lib/admin/data';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kpis = await getOverview();
  const inquiries = await listContactInquiries();
  return NextResponse.json({ kpis, inquiries });
}
