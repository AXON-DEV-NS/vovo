import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { getActivePlans, updatePlan, getAutoTrialSetting, setAutoTrialSetting } from '@/lib/admin/data';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [plans, autoTrialEnabled] = await Promise.all([
    getActivePlans(),
    getAutoTrialSetting(),
  ]);
  return NextResponse.json({ plans, autoTrialEnabled });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (typeof body.autoTrialEnabled === 'boolean') {
    const updated = await setAutoTrialSetting(body.autoTrialEnabled);
    return NextResponse.json({ ok: true, autoTrialEnabled: updated });
  }

  const { id, name, monthlyPrice, yearlyPrice } = body;

  if (!id) {
    return NextResponse.json({ error: 'معرّف الخطة مطلوب' }, { status: 400 });
  }

  const plan = await updatePlan(id, { name, monthlyPrice, yearlyPrice });
  if (!plan) {
    return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, plan });
}
