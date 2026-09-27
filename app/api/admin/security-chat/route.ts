import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-session';
import { querySecurityGuardian } from '@/lib/security/guardian';
import { appendChatMessage, getChatHistory, hasConfiguredAiKey } from '@/lib/admin/data';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAi = hasConfiguredAiKey();

  const messages = await getChatHistory();
  if (messages.length === 0) {
    return NextResponse.json({
      guardianActive: hasAi,
      messages: [
        {
          id: 'welcome',
          sender: 'guardian',
          message: hasAi
            ? '🛡️ **The smart security guardian is online**. I continuously monitor authentication points, magic-link logs, rate limits, lockouts, and audit events across the system. Ask me anything about the security posture or suspicious activity.'
            : '⚠️ **Alert: the AI security guardian is currently offline**. No AI key (DeepSeek API Key) has been provided. Please add and activate the key in the .env.local file so the guardian can operate at full capacity.',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }
  return NextResponse.json({ guardianActive: hasAi, messages });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await request.json().catch(() => ({}));
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  await appendChatMessage('admin', message);

  const hasAi = Boolean(
    (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim().length > 0) ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) ||
    (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0)
  );

  if (!hasAi) {
    const offlineReply = '⚠️ **The AI security guardian is offline**: your request cannot be processed intelligently because no DeepSeek key is available. Please add and activate the key in the .env.local file first.';
    await appendChatMessage('guardian', offlineReply);
    return NextResponse.json({
      reply: offlineReply,
      timestamp: new Date().toISOString(),
    });
  }

  const guardianReply = await querySecurityGuardian(message);
  await appendChatMessage('guardian', guardianReply);

  return NextResponse.json({
    reply: guardianReply,
    timestamp: new Date().toISOString(),
  });
}
