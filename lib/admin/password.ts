import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * scrypt-based password hashing using only Node's built-in crypto.
 * Stored as a single base64 blob (`scrypt:<base64(salt + hash)>`) so the
 * value contains no '$' or '#' — safe to place in an unquoted .env value
 * and immune to dotenv variable-expansion quirks.
 */
export function hashPassword(password: string, salt?: Buffer): string {
  const s = salt ?? randomBytes(16);
  const hash = scryptSync(password, s, 64);
  return `scrypt:${Buffer.concat([s, hash]).toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, b64] = stored.split(":");
    if (scheme !== "scrypt" || !b64) return false;

    const combined = Buffer.from(b64, "base64");
    if (combined.length < 64) return false;

    const salt = combined.subarray(0, 16);
    const expected = combined.subarray(16);
    const actual = scryptSync(password, salt, 64);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 12;
}
