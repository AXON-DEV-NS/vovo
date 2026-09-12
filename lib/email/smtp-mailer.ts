import nodemailer, { type Transporter } from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  secure: boolean;
  from: string;
}

export interface MailMessage {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  success: boolean;
  provider: "primary" | "secondary" | "none" | "failed";
  messageId?: string;
  error?: string;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function readConfig(prefix: "" | "SECONDARY_"): SmtpConfig | null {
  const host = process.env[`SMTP_${prefix}HOST`]?.trim();
  if (!host) return null;

  const portRaw = process.env[`SMTP_${prefix}PORT`]?.trim();
  const port = portRaw ? Number(portRaw) : 587;

  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    user: process.env[`SMTP_${prefix}USER`]?.trim() || undefined,
    pass: process.env[`SMTP_${prefix}PASS`] || undefined,
    // Default secure to true for 465, false for 587/25.
    secure: parseBool(process.env[`SMTP_${prefix}SECURE`], port === 465),
    from:
      process.env[`SMTP_${prefix}FROM`]?.trim() ||
      process.env.EMAIL_FROM?.trim() ||
      "VOVO Platform <no-reply@vovo.ai>",
  };
}

export function readPrimarySmtp(): SmtpConfig | null {
  return readConfig("");
}

export function readSecondarySmtp(): SmtpConfig | null {
  return readConfig("SECONDARY_");
}

function buildTransporter(cfg: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user
      ? { user: cfg.user, pass: cfg.pass ?? "" }
      : undefined,
  });
}

interface Attempt {
  provider: "primary" | "secondary";
  cfg: SmtpConfig;
}

/**
 * Sends an email through the primary SMTP provider first, then automatically
 * fails over to the secondary provider if the primary attempt throws.
 */
export async function sendMail(message: MailMessage): Promise<SendResult> {
  const attempts: Attempt[] = [];
  const primary = readPrimarySmtp();
  const secondary = readSecondarySmtp();

  if (primary) attempts.push({ provider: "primary", cfg: primary });
  if (secondary) attempts.push({ provider: "secondary", cfg: secondary });

  if (attempts.length === 0) {
    console.error("[SMTP] No SMTP provider configured (SMTP_HOST / SMTP_SECONDARY_HOST).");
    return { success: false, provider: "none", error: "No SMTP provider configured" };
  }

  let lastError: string | undefined;

  for (const attempt of attempts) {
    const transporter = buildTransporter(attempt.cfg);
    try {
      const info = await transporter.sendMail({
        from: attempt.cfg.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      console.log(
        `[SMTP] Sent via ${attempt.provider} (${attempt.cfg.host}) to ${message.to} | MessageID: ${info.messageId}`
      );
      return { success: true, provider: attempt.provider, messageId: info.messageId };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(
        `[SMTP] ${attempt.provider} provider (${attempt.cfg.host}) failed: ${lastError}`
      );
    }
  }

  return { success: false, provider: "failed", error: lastError };
}
