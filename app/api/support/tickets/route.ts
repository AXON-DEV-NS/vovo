import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserTickets, createTicket } from '@/lib/services/support';
import { notifySupportTicketCreated } from '@/lib/email/notifier';

type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await getUserTickets(session.userId);
  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { subject, description, priority } = body;

  if (!subject?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Subject and description are required.' }, { status: 400 });
  }

  const validPriorities: TicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const resolvedPriority: TicketPriority = validPriorities.includes(priority) ? priority : 'NORMAL';

  const ticket = await createTicket({
    userId: session.userId,
    subject: subject.trim(),
    description: description.trim(),
    priority: resolvedPriority,
  });

  // Notify admin at oren.on.oren.25@gmail.com of the newly opened problem / issue
  notifySupportTicketCreated({
    ticketId: ticket.id,
    userId: session.userId,
    userEmail: session.email,
    subject: ticket.subject,
    description: ticket.description,
    priority: resolvedPriority,
  }).catch((err) => console.error('[Ticket Notifier Error]', err));

  return NextResponse.json(ticket, { status: 201 });
}
