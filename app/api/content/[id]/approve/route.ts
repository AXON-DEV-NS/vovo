import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { applyReviewAction, type ApprovalAction } from '@/lib/services/content';

const VALID_ACTIONS: ApprovalAction[] = ['approve', 'reject', 'request_changes'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, comment } = body as { action: ApprovalAction; comment?: string };

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  if (action === 'request_changes' && !comment?.trim()) {
    return NextResponse.json(
      { error: 'A comment is required when requesting changes.' },
      { status: 400 }
    );
  }

  try {
    const updated = await applyReviewAction({
      itemId: id,
      userId: session.userId,
      action,
      comment,
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Content item not found.' }, { status: 404 });
    }
    if (message.startsWith('INVALID_STATE:')) {
      return NextResponse.json(
        { error: `Action not allowed. Item is currently in state: ${message.split(':')[1]}` },
        { status: 409 }
      );
    }
    console.error('[content approve]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
