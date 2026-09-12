/**
 * Runtime resolution of external service keys.
 * Order: the admin secrets vault (encrypted, saved from the API-keys page)
 * takes precedence, then the environment variable.
 * Server-side only — never import in a client component.
 */
import { getServiceKey } from "@/lib/admin/secrets";

export async function resolveRuntimeKey(
  service: string,
  envVar: string
): Promise<string | undefined> {
  try {
    const stored = await getServiceKey(service);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    // vault unavailable — fall through to env
  }
  const env = process.env[envVar];
  return env && env.trim() ? env.trim() : undefined;
}
