import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTicketWithMessages } from '@/lib/services/support';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ticket = await getTicketWithMessages(id, session.userId);
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  return NextResponse.json(ticket);
}
