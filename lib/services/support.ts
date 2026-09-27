/**
 * support.ts — Support ticket service layer.
 */

import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from './audit';

// Local types matching Prisma enums — compatible once `prisma generate` runs
type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED';

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getUserTickets(userId: string) {
  return prisma.supportTicket.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // latest message for preview
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getTicketWithMessages(ticketId: string, userId: string) {
  return prisma.supportTicket.findFirst({
    where: { id: ticketId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createTicket(data: {
  userId: string;
  subject: string;
  description: string;
  priority: TicketPriority;
}) {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: data.userId,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: 'OPEN',
      messages: {
        create: {
          userId: data.userId,
          content: data.description,
          isStaff: false,
        },
      },
    },
    include: { messages: true },
  });

  await writeAuditLog({
    action: 'ticket.created',
    actorId: data.userId,
    targetUserId: data.userId,
    metadata: { ticketId: ticket.id, priority: data.priority },
  });

  return ticket;
}

export async function addTicketReply(params: {
  ticketId: string;
  userId: string;
  content: string;
  isStaff?: boolean;
}) {
  // Ensure ticket belongs to user (or isStaff)
  if (!params.isStaff) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: params.ticketId, userId: params.userId },
    });
    if (!ticket) throw new Error('NOT_FOUND');
  }

  const [message] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: params.ticketId,
        userId: params.userId,
        content: params.content,
        isStaff: params.isStaff ?? false,
      },
    }),
    prisma.supportTicket.update({
      where: { id: params.ticketId },
      data: {
        status: params.isStaff ? 'WAITING_ON_CLIENT' : 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    }),
  ]);

  await writeAuditLog({
    action: 'ticket.replied',
    actorId: params.userId,
    metadata: { ticketId: params.ticketId, isStaff: params.isStaff },
  });

  return message;
}
