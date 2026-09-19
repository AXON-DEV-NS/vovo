import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

const globalForOtp = globalThis as unknown as {
  memoryOtpStore?: Map<string, OtpRecord>;
};

const memoryOtpStore = globalForOtp.memoryOtpStore ?? new Map<string, OtpRecord>();
globalForOtp.memoryOtpStore = memoryOtpStore;

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 5;

function cleanExpired() {
  const now = Date.now();
  memoryOtpStore.forEach((value, key) => {
    if (value.expiresAt < now) {
      memoryOtpStore.delete(key);
    }
  });
}

export async function saveOtp(email: string, code: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;

  if (HAS_REDIS) {
    try {
      const client = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string });
      await client.set(
        `otp:${normalizedEmail}`,
        JSON.stringify({ code, expiresAt, attempts: 0 }),
        { ex: OTP_TTL_SECONDS }
      );
      return;
    } catch (err) {
      console.warn("[OTP Store] Redis error, falling back to in-memory:", err);
    }
  }

  cleanExpired();
  memoryOtpStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
  });
}

export async function verifyAndConsumeOtp(
  email: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = inputCode.trim();

  if (HAS_REDIS) {
    try {
      const client = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string });
      const raw = await client.get<string>(`otp:${normalizedEmail}`);
      if (!raw) {
        return { success: false, error: "Code expired or not found. Please request a new one." };
      }

      const record: OtpRecord = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (Date.now() > record.expiresAt) {
        await client.del(`otp:${normalizedEmail}`);
        return { success: false, error: "Code has expired. Please request a new one." };
      }

      if (record.attempts >= MAX_ATTEMPTS) {
        await client.del(`otp:${normalizedEmail}`);
        return { success: false, error: "Too many incorrect attempts. Please request a new code." };
      }

      if (record.code !== trimmedCode) {
        record.attempts += 1;
        const remainingTtl = Math.max(1, Math.floor((record.expiresAt - Date.now()) / 1000));
        await client.set(`otp:${normalizedEmail}`, JSON.stringify(record), { ex: remainingTtl });
        const remaining = MAX_ATTEMPTS - record.attempts;
        return {
          success: false,
          error: `Incorrect code. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
        };
      }

      // Valid code — remove so it can't be reused
      await client.del(`otp:${normalizedEmail}`);
      return { success: true };
    } catch (err) {
      console.warn("[OTP Store] Redis verify error, falling back to in-memory:", err);
    }
  }

  cleanExpired();
  const record = memoryOtpStore.get(normalizedEmail);
  if (!record) {
    return { success: false, error: "Code expired or not found. Please request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    memoryOtpStore.delete(normalizedEmail);
    return { success: false, error: "Code has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    memoryOtpStore.delete(normalizedEmail);
    return { success: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (record.code !== trimmedCode) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      error: `Incorrect code. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
    };
  }

  // Valid code — remove
  memoryOtpStore.delete(normalizedEmail);
  return { success: true };
}
