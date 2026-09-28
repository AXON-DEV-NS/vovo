/**
 * lib/email/notifier.ts
 * Centralized email and incident notification dispatcher.
 * Dispatches all contact requests, user issues, and support tickets
 * directly to the admin's inbox (ADMIN_EMAIL).
 */

import { writeAuditLog } from "@/lib/services/audit";
import { readEnvLocal } from "@/lib/admin/secrets";
import { getStore, saveContactInquiry } from "@/lib/admin/data";
import { sendMail } from "@/lib/email/smtp-mailer";

export const NOTIFICATION_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

/**
 * "From" address used by the email provider. For Resend this MUST be a
 * sender on a domain you verified in the Resend dashboard (e.g. your own
 * domain), NOT onboarding@resend.dev (which can only deliver to the account
 * owner during testing).
 */
export const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() || "VOVO Platform <onboarding@resend.dev>";

/**
 * Resolves the configured Resend / Email provider API key from env or secrets store.
 */
function getEmailApiKey(): string | null {
  if (process.env.EMAIL_API_KEY && process.env.EMAIL_API_KEY.trim().length > 0) {
    return process.env.EMAIL_API_KEY.trim();
  }
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0) {
    return process.env.RESEND_API_KEY.trim();
  }
  try {
    const env = readEnvLocal();
    if (env.EMAIL_API_KEY && env.EMAIL_API_KEY.trim().length > 0) return env.EMAIL_API_KEY.trim();
    if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0) return env.RESEND_API_KEY.trim();
  } catch {
    // ignore
  }
  try {
    const store = getStore();
    if (store?.apiKeys?.email_provider && store.apiKeys.email_provider.trim().length > 0) {
      return store.apiKeys.email_provider.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

export interface EmailDispatchOptions {
  to?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Dispatches an email via SMTP (primary provider, failing over to the
 * secondary provider on error). Falls back to Resend HTTP only if no SMTP
 * provider is configured but a Resend key is present.
 */
export async function sendNotificationEmail(
  options: EmailDispatchOptions
): Promise<{ success: boolean; method: string; messageId?: string; error?: string }> {
  const recipient = options.to || NOTIFICATION_EMAIL;
  if (!recipient) {
    console.error("[Email] No notification recipient configured (ADMIN_EMAIL is not set).");
    return { success: false, method: "none", error: "No notification recipient configured" };
  }
  const message = {
    to: recipient,
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  // 1) SMTP primary → secondary failover.
  const smtp = await sendMail(message);
  if (smtp.success) {
    return { success: true, method: smtp.provider, messageId: smtp.messageId };
  }

  // 2) Fall back to Resend HTTP only if SMTP was not configured at all.
  if (smtp.provider === "none") {
    const apiKey = getEmailApiKey();
    if (apiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [recipient],
            reply_to: options.replyTo,
            subject: options.subject,
            html: options.html,
            text: options.text,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.id) {
          console.log(`[Email Dispatched] To: ${recipient} | Subject: ${options.subject} | ID: ${data.id}`);
          return { success: true, method: "resend", messageId: data.id };
        }
        console.warn(`[Email Provider Notice] Status ${res.status}:`, data);
      } catch (err) {
        console.error("[Email Provider Error]", err);
      }
    }
  }

  // 3) Nothing could deliver — log as an incident and report failure.
  console.error(
    `[Email Failed] To: ${recipient} | Subject: ${options.subject} | ${smtp.error || "no provider configured"}`
  );
  console.log(`[INCIDENT / NOTIFICATION TO ${recipient}] Subject: ${options.subject}\nText:\n${options.text}`);
  return {
    success: false,
    method: smtp.provider === "none" ? "none" : "failed",
    error: smtp.error || "No email provider configured",
  };
}

/**
 * Sends a notification when a visitor/client submits the Contact Us form.
 */
export async function notifyContactSubmission(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  ipAddress?: string;
}) {
  const title = data.subject?.trim() || "New inquiry message";
  const subject = `[VOVO New Contact] ${title} — from ${data.name}`;

  const html = `
    <div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #111110; padding: 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold;">VOVO Agent AI</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #9ca3af;">You received a new contact / inquiry message through the website</p>
      </div>
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>From:</strong> ${data.name}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Subject:</strong> ${title}</p>
          ${data.ipAddress ? `<p style="margin: 0; font-size: 12px; color: #6b7280;"><strong>IP address:</strong> ${data.ipAddress}</p>` : ""}
        </div>
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">Message:</h3>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #111827; white-space: pre-wrap;">${data.message}</div>
        </div>
        <div style="text-align: center;">
          <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(title)}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Reply to the customer</a>
        </div>
      </div>
      <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        This message was received via the Contact Us page on the VOVO Agent AI platform
      </div>
    </div>
  `;

  const text = `
New contact message on the VOVO Agent AI platform:
Name: ${data.name}
Email: ${data.email}
Subject: ${title}
${data.ipAddress ? `IP: ${data.ipAddress}\n` : ""}
Message:
${data.message}
  `.trim();

  await sendNotificationEmail({
    replyTo: data.email,
    subject,
    html,
    text,
  });

  await saveContactInquiry({
    name: data.name,
    email: data.email,
    subject: title,
    message: data.message,
    ipAddress: data.ipAddress,
  });

  await writeAuditLog({
    action: "contact.submitted",
    actorId: data.email,
    metadata: { name: data.name, subject: title },
  });
}

/**
 * Sends a notification when a client opens a new support ticket / problem.
 */
export async function notifySupportTicketCreated(data: {
  ticketId: string;
  userId: string;
  userEmail?: string;
  subject: string;
  description: string;
  priority: string;
}) {
  const priorityBadge =
    data.priority === "URGENT" ? "🔴 Critical" : data.priority === "HIGH" ? "🟠 High priority" : "🔵 Normal";

  const subject = `🚨 [VOVO Support Ticket - ${data.priority}] ${data.subject}`;

  const html = `
    <div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #dc2626; padding: 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold;">Alert: New problem / support ticket</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #fee2e2;">A customer opened a support ticket for a problem they're facing</p>
      </div>
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Ticket ID:</strong> #${data.ticketId}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Customer:</strong> ${data.userEmail || data.userId}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Priority:</strong> ${priorityBadge}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Subject:</strong> ${data.subject}</p>
        </div>
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">Issue details:</h3>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #111827; white-space: pre-wrap;">${data.description}</div>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/vovo-hq-secure-gateway/overview" style="display: inline-block; background: #111110; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Open the admin panel</a>
        </div>
      </div>
      <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        Support &amp; incidents alert system — VOVO HQ
      </div>
    </div>
  `;

  const text = `
New problem / support ticket alert:
Ticket ID: #${data.ticketId}
Customer: ${data.userEmail || data.userId}
Priority: ${data.priority}
Subject: ${data.subject}

Details:
${data.description}
  `.trim();

  await sendNotificationEmail({
    replyTo: data.userEmail,
    subject,
    html,
    text,
  });
}

/**
 * Sends a notification when a client replies to an existing ticket.
 */
export async function notifySupportTicketReply(data: {
  ticketId: string;
  userId: string;
  userEmail?: string;
  content: string;
}) {
  const subject = `💬 [VOVO Customer Reply] on support ticket #${data.ticketId}`;

  const html = `
    <div dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #111110; padding: 20px; color: #ffffff; text-align: center;">
        <h2 style="margin: 0; font-size: 18px; font-weight: bold;">New reply on ticket #${data.ticketId}</h2>
      </div>
      <div style="padding: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563;">The customer (${data.userEmail || data.userId}) added a new reply:</p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #111827; white-space: pre-wrap;">${data.content}</div>
      </div>
    </div>
  `;

  const text = `New reply on ticket #${data.ticketId} from ${data.userEmail || data.userId}:\n\n${data.content}`;

  await sendNotificationEmail({
    replyTo: data.userEmail,
    subject,
    html,
    text,
  });
}
