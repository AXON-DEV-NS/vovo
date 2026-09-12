/**
 * One-time owner setup: generates the admin password hash and TOTP
 * secret for .env.local, plus the otpauth:// URI to scan into an
 * authenticator app (Google Authenticator / 1Password / Authy).
 *
 * Usage:
 *   node scripts/setup-admin.mjs "<strong-unique-password>"
 *
 * Then copy the printed values into .env.local:
 *   ADMIN_PASSWORD_HASH="..."
 *   ADMIN_TOTP_SECRET="..."
 *   ADMIN_EMAIL="you@example.com"
 */
import { createHmac, randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: node scripts/setup-admin.mjs \"<strong-unique-password>\"");
  console.error("The password must be at least 12 characters and unique to this site.");
  process.exit(1);
}

// scrypt password hash (base64 blob, no '$' or '#' — safe for .env)
function hashPassword(pwd) {
  const salt = randomBytes(16);
  const hash = scryptSync(pwd, salt, 64);
  return `scrypt:${Buffer.concat([salt, hash]).toString("base64")}`;
}

// Base32 helpers for TOTP
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateTotpSecret() {
  const bytes = randomBytes(20);
  let result = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      result += B32[(buffer >> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }
  if (bitsLeft > 0) result += B32[(buffer << (5 - bitsLeft)) & 31];
  return result;
}

const hash = hashPassword(password);
const secret = generateTotpSecret();

const label = process.env.ADMIN_EMAIL || "owner@vovo-agent.ai";
const otpauth =
  `otpauth://totp/${encodeURIComponent(`VOVO Agent AI:${label}`)}` +
  `?secret=${secret}&issuer=${encodeURIComponent("VOVO Agent AI")}` +
  `&algorithm=SHA1&digits=6&period=30`;

console.log("");
console.log("Add these to your .env.local:");
console.log("");
console.log(`ADMIN_EMAIL="${label}"`);
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
console.log(`ADMIN_TOTP_SECRET="${secret}"`);
console.log("");
console.log("Scan this URI with your authenticator app for 2FA codes:");
console.log("");
console.log(otpauth);
console.log("");
console.log("Then promote your account in the database (one-time):");
console.log("  node scripts/set-admin.mjs <your-email>");
