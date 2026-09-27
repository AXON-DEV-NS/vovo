/**
 * Resolves the session-signing secret with safe production behavior.
 *
 * - Production: NEXTAUTH_SECRET is required; throws if missing so the app
 *   refuses to boot with a weak default.
 * - Development: falls back to a random, process-local secret (stable within
 *   a single `next dev` run) and logs a warning.
 */
const FALLBACK = randomDevSecret();
let warned = false;

export function getSessionSecret(): string {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required in production.");
  }

  if (!warned) {
    console.warn(
      "[Auth] NEXTAUTH_SECRET is not set — using a random process-local secret (dev only)."
    );
    warned = true;
  }
  return FALLBACK;
}

/**
 * Lazy byte form of the session secret.
 *
 * Resolved on first use (request time) instead of module load, so `next build`
 * never fails when environment variables are injected later by the platform.
 */
let cachedBytes: Uint8Array | null = null;

export function getSessionSecretBytes(): Uint8Array {
  if (!cachedBytes) {
    cachedBytes = new TextEncoder().encode(getSessionSecret());
  }
  return cachedBytes;
}

function randomDevSecret(): string {
  // Random per-process fallback — never a hardcoded value.
  return `dev-${Math.random().toString(36)}-${Date.now().toString(36)}`;
}
