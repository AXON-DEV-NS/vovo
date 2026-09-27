import { resolveRuntimeKey } from "@/lib/admin/runtime-keys";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/google/callback`;

export const GOOGLE_SCOPES = ["openid", "email", "profile"];

async function resolveClientId(): Promise<string> {
  return (
    (await resolveRuntimeKey("youtube_client_id", "GOOGLE_CLIENT_ID")) ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

async function resolveClientSecret(): Promise<string> {
  return (await resolveRuntimeKey("youtube_client_secret", "GOOGLE_CLIENT_SECRET")) || "";
}

export async function isGoogleConfigured(): Promise<boolean> {
  const id = await resolveClientId();
  const secret = await resolveClientSecret();
  return Boolean(id && secret);
}

export async function getGoogleAuthUrl(state: string): Promise<string> {
  const clientId = await resolveClientId();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = await resolveClientId();
  const clientSecret = await resolveClientSecret();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error("Failed to exchange code for tokens");
  return response.json();
}

export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch user info");
  return response.json();
}
