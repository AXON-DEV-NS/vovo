import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createSession } from "@/lib/auth/session";
import { resolveUserRole } from "@/lib/auth/roles";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vovo-5b434";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Missing Firebase ID token" },
        { status: 400 }
      );
    }

    // Cryptographically verify the Firebase ID Token against Google's public keys
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const userId = (payload.sub || payload.user_id || "") as string;
    const name = (payload.name as string) || email.split("@")[0] || "User";

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Token does not contain required user identity" },
        { status: 400 }
      );
    }

    // Check if the user is owner/admin or standard user
    const adminEmail = (process.env.ADMIN_EMAIL || "oren.on.oren.25@gmail.com").trim().toLowerCase();
    const isOwner = email === adminEmail;
    const role = isOwner ? "ADMIN" : await resolveUserRole(email, "USER");

    // Create the session cookie
    await createSession({
      userId,
      email,
      name,
      role,
    });

    // Persist a real user row so the admin panel reflects actual signups.
    const { ensureDbUser } = await import("@/lib/auth/db-user");
    await ensureDbUser(email, name);

    return NextResponse.json({
      success: true,
      redirect: isOwner ? "/vovo-hq-secure-gateway" : "/onboarding",
      user: {
        email,
        name,
        role,
      },
    });
  } catch (error) {
    console.error("[Auth] Firebase token verification failed:", error);
    return NextResponse.json(
      { error: "Authentication failed. Invalid or expired token." },
      { status: 401 }
    );
  }
}
