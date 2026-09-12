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
            ? '🛡️ **الحارس الأمني الذكي متصل**. أراقب باستمرار نقاط المصادقة، سجلات الروابط السحرية، حدود المعدل، الإقفالات، وأحداث التدقيق في النظام. اسألني أي سؤال عن الوضع الأمني أو النشاط المشبوه.'
            : '⚠️ **تنبيه: الحارس الأمني للذكاء الاصطناعي متوقف حالياً**. لم يتم إدخال مفتاح الذكاء الاصطناعي (DeepSeek API Key). يرجى إدخال وتفعيل المفتاح في ملف .env.local ليعمل الحارس بكامل طاقته.',
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
    return NextResponse.json({ error: 'الرسالة مطلوبة' }, { status: 400 });
  }

  await appendChatMessage('admin', message);

  const hasAi = Boolean(
    (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim().length > 0) ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) ||
    (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0)
  );

  if (!hasAi) {
    const offlineReply = '⚠️ **الحارس الأمني للذكاء الاصطناعي متوقف**: لا يمكن إجراء معالجة ذكية لطلبك لعدم توفر مفتاح DeepSeek. يرجى إدخال وتفعيل المفتاح أولاً في ملف .env.local.';
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
