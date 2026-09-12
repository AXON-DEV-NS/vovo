"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Clock, ExternalLink } from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setSuccess(false);
    setError(false);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          message: form.get("message"),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="section-padding">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <span className="eyebrow">{t("title")}</span>
          <h1 className="display mt-5 text-display-lg">{t("subtitle")}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-2">
            <Card>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input name="name" label={t("form.name")} placeholder={t("form.namePlaceholder")} required />
                    <Input name="email" type="email" label={t("form.email")} placeholder={t("form.emailPlaceholder")} required />
                  </div>
                  <Input name="subject" label={t("form.subject")} placeholder={t("form.subjectPlaceholder")} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-soft">{t("form.message")}</label>
                    <textarea
                      name="message"
                      rows={5}
                      placeholder={t("form.messagePlaceholder")}
                      required
                      className="flex w-full rounded-xl border border-line bg-paper-high px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors"
                    />
                  </div>
                  {success && <p className="text-sm text-green-600">{t("form.success")}</p>}
                  {error && <p className="text-sm text-red-500">{t("form.error")}</p>}
                  <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
                    {sending ? t("form.sending") : t("form.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-ink">{t("info.email")}</p>
                    <p className="text-xs text-ink-mute">{t("info.responseTime")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-ink-soft">{t("info.existingUsers")}</p>
                    <Link href="/support" className="text-sm font-medium text-green-600 hover:underline inline-flex items-center gap-1">
                      {t("info.supportCenter")} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
