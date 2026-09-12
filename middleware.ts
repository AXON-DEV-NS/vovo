import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { routing } from "./lib/i18n/routing";
import { ADMIN_ROUTE_PREFIX, PROTECTED_ROUTES } from "./lib/constants";
import { getSessionSecret } from "./lib/auth/session-secret";

const intlMiddleware = createMiddleware(routing);

const SESSION_SECRET = new TextEncoder().encode(getSessionSecret());

/**
 * Production Security & Internationalization Middleware
 * - Enforces Route-Gate Isolation for Admin and Client dashboards
 * - Injects Industry-Standard Security Headers (OWASP recommendations)
 * - Verifies JWT Role and Owner Email to prevent privilege escalation
 */
async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const allowedEmail = (process.env.ADMIN_EMAIL || "oren.on.oren.25@gmail.com").trim().toLowerCase();
  const tokens = [
    request.cookies.get("admin_session")?.value,
    request.cookies.get("session")?.value,
  ].filter(Boolean) as string[];

  for (const token of tokens) {
    try {
      const { payload } = await jwtVerify(token, SESSION_SECRET);
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      if (payload.role === "ADMIN" && email === allowedEmail) {
        return true;
      }
    } catch {
      // invalid token — try the next one
    }
  }
  return false;
}

async function hasSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SESSION_SECRET);
    return true;
  } catch {
    return false;
  }
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-XSS-Protection", "1; mode=block");

  // Strict CSP: locks down scripts, styles, and strictly enforces form-action 'self'
  // to guarantee no attacker can hijack or redirect checkout/payment forms externally.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob: https://*.googleusercontent.com",
    "connect-src 'self' https://api.deepseek.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://*.googleapis.com https://api.elevenlabs.io https://api.higgsfield.ai https://api.tavily.com https://api.resend.com https://*.upstash.io https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);

  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  return res;
}

function stripLocale(pathname: string): string {
  for (const loc of routing.locales) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
      const rest = pathname.slice(loc.length + 1);
      return rest ? (rest.startsWith("/") ? rest : `/${rest}`) : "/";
    }
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permanently block and banish any 2fa / totp page attempt — force immediate redirect to homepage
  if (pathname.toLowerCase().includes("2fa") || pathname.toLowerCase().includes("totp")) {
    const res = NextResponse.redirect(new URL("/", request.url), { status: 302 });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return applySecurityHeaders(res);
  }

  const normalizedPath = stripLocale(pathname);
  const adminPrefix = `/${ADMIN_ROUTE_PREFIX}`;
  const adminLoginPath = `${adminPrefix}/login`;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  );

  const isAdminRoute =
    normalizedPath === adminPrefix || normalizedPath.startsWith(`${adminPrefix}/`);
  const isAdminLoginPage = normalizedPath === adminLoginPath;
  const isAdminPanelRoute = isAdminRoute && !isAdminLoginPage;

  // Admin panel: only the owner's admin session passes. Everyone else —
  // logged out or regular user — is sent to the homepage as if it does not exist.
  if (isAdminPanelRoute) {
    if (!(await isAdminRequest(request))) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
    return applySecurityHeaders(intlMiddleware(request));
  }

  // Client dashboard: any authenticated session passes.
  if (isProtectedRoute) {
    if (!(await hasSession(request))) {
      const redirectRes = NextResponse.redirect(new URL("/login", request.url));
      redirectRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      redirectRes.headers.set("Pragma", "no-cache");
      if (request.cookies.has("session")) {
        redirectRes.cookies.delete("session");
      }
      return applySecurityHeaders(redirectRes);
    }
  }

  return applySecurityHeaders(intlMiddleware(request));
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
