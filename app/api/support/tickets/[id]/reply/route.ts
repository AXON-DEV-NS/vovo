import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { addTicketReply } from '@/lib/services/support';
import { notifySupportTicketReply } from '@/lib/email/notifier';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Reply content is required.' }, { status: 400 });
  }

  try {
    const message = await addTicketReply({
      ticketId: id,
      userId: session.userId,
      content: content.trim(),
      isStaff: false,
    });

    notifySupportTicketReply({
      ticketId: id,
      userId: session.userId,
      userEmail: session.email,
      content: content.trim(),
    }).catch((err) => console.error('[Ticket Reply Notifier Error]', err));

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }
    console.error('[ticket reply]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
