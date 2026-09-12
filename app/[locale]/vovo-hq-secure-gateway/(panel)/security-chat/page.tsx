'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  sender: 'admin' | 'guardian';
  message: string;
  createdAt: string;
}

const QUICK_PROMPTS = [
  'هل هناك نشاط تسجيل دخول مشبوه اليوم؟',
  'اعرض الحسابات ذات محاولات الروابط السحرية الفاشلة المتكررة',
  'اعرض حالات الإقفال وحدود المعدل الأخيرة',
  'ملخص عن الصحة الأمنية للمنصة',
];

export default function SecurityChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guardianActive, setGuardianActive] = useState<boolean>(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetch('/api/admin/security-chat')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.guardianActive === 'boolean') {
          setGuardianActive(data.guardianActive);
        }
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([
            {
              id: 'init_1',
              sender: 'guardian',
              message: data.guardianActive
                ? '🛡️ **الحارس الأمني الذكي متصل**. أراقب نقاط المصادقة وروابط الدخول السحري وحدود المعدل والإقفالات وأحداث التدقيق. اسألني أي سؤال عن الوضع الأمني أو النشاط المشبوه.'
                : '⚠️ **تنبيه: الحارس الأمني للذكاء الاصطناعي متوقف حالياً**. لم يتم إدخال مفتاح الذكاء الاصطناعي (DeepSeek API Key). يرجى إدخال وتفعيل المفتاح في ملف .env.local ليعمل الحارس بكامل طاقته.',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to load chat history:', err);
      });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'admin',
      message: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/security-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query Security Guardian');

      const guardianMsg: ChatMessage = {
        id: `guardian_${Date.now()}`,
        sender: 'guardian',
        message: data.reply,
        createdAt: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, guardianMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'guardian',
          message: `⚠️ **خطأ في التواصل مع الحارس**: ${err.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">محادثة الحارس الأمني الذكي</h1>
            <Badge
              variant="default"
              className={
                guardianActive
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-amber-100 text-amber-800 border-amber-200"
              }
            >
              {guardianActive ? "🟢 مراقبة مباشرة (نشط)" : "🟠 متوقف — بانتظار مفتاح AI"}
            </Badge>
          </div>
          <p className="text-sm text-ink-mute">
            اسأل بلغة طبيعية للاستعلام عن أحداث المصادقة الحقيقية وحدود المعدل والإقفالات وسجلات التدقيق.
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="bg-paper-high border-line shadow-md flex flex-col h-[650px]">
        {/* Chat History Header */}
        <CardHeader className="py-3 px-6 border-b border-line bg-paper/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-paper-high flex items-center justify-center text-xs font-bold">
              🛡️
            </div>
            <div>
              <CardTitle className="text-sm text-ink font-bold">وحدة تحكم نظام الحارس</CardTitle>
              <span className="text-xs text-ink-mute">
                {guardianActive
                  ? "متصل بتيارات أحداث الأمان وسجلات التدقيق"
                  : "متوقف — بانتظار إدخال وتفعيل مفتاح الذكاء الاصطناعي (DeepSeek API Key)"}
              </span>
            </div>
          </div>

          <div className="text-xs text-ink-faint font-mono">
            {messages.length} رسالة في الذاكرة
          </div>
        </CardHeader>

        {/* Message Thread */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-paper/30">
          {messages.map((msg) => {
            const isGuardian = msg.sender === 'guardian';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isGuardian ? 'justify-start' : 'justify-end'}`}
              >
                {isGuardian && (
                  <div className="w-8 h-8 rounded-full bg-ink text-paper-high flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                    🛡️
                  </div>
                )}

                <div
                  className={`max-w-[85%] min-w-0 rounded-2xl p-4 text-sm leading-relaxed ${
                    isGuardian
                      ? 'bg-paper-high border border-line text-ink shadow-xs'
                      : 'bg-ink text-paper-high shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{msg.message}</div>
                  <div
                    className={`text-[10px] mt-2 ${
                      isGuardian ? 'text-ink-faint' : 'text-line-strong'
                    } text-right font-mono`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {!isGuardian && (
                  <div className="w-8 h-8 rounded-full bg-red-600 text-paper-high flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                    مدير
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-ink text-paper-high flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                🛡️
              </div>
              <div className="bg-paper-high border border-line rounded-2xl p-4 text-sm text-ink-mute flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ink-faint animate-ping"></span>
                <span>الحارس يحلل سجلات الأمان وأحداث قاعدة البيانات...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Quick Prompts Bar */}
        <div className="px-6 py-2 border-t border-line bg-paper flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-ink-faint shrink-0">استعلامات سريعة:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-xs bg-paper-high hover:bg-line text-ink-soft border border-line px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <CardFooter className="p-4 border-t border-line bg-paper-high">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full gap-3"
          >
            <Input
              type="text"
              placeholder="اسأل الحارس عن حالات الشذوذ في تسجيل الدخول، حدود المعدل، سجلات التدقيق..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-sm focus:border-red-500"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="green"
              className="bg-ink hover:bg-ink-soft text-paper-high px-5"
              disabled={loading || !input.trim()}
            >
              {loading ? 'جارٍ التحليل...' : 'اسأل الحارس'}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
