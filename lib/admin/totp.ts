import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * TOTP (RFC 6238) implemented with Node's built-in crypto — no dependencies.
 * Verified against Google Authenticator / 1Password / Authy.
 */
export function generateTotpSecret(length = 20): string {
  const bytes = randomBytes(length);
  let result = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      result += BASE32_ALPHABET[(buffer >> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }
  if (bitsLeft > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31];
  }
  return result;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.replace(/[\s=]/g, "").toUpperCase();
  let buffer = 0;
  let bitsLeft = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateCode(key: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

export function getCurrentTotp(secret: string): { code: string; remainingSeconds: number } {
  const key = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / 30);
  const remainingSeconds = 30 - (now % 30);
  const code = generateCode(key, counter);
  return { code, remainingSeconds };
}

/**
 * Verify a 6-digit code against a base32 secret, allowing ±1 time step
 * to tolerate clock drift between the device and the server.
 */
export function verifyTotp(secret: string, code: string, window = 1): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const key = base32Decode(secret);
  if (key.length === 0) return false;

  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let offset = -window; offset <= window; offset++) {
    const expected = generateCode(key, counter + offset);
    if (
      expected.length === code.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(code))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * otpauth:// URI for scanning into an authenticator app.
 */
export function getOtpauthUri(secret: string, label: string, issuer: string): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${label}`)}?${params.toString()}`;
}
