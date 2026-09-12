import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await deleteSession();
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("admin_session");

  const response = NextResponse.json(
    { success: true, redirect: "/login" },
    { status: 200 }
  );

  // Explicitly tell the browser to invalidate session cookies immediately
  response.headers.set(
    "Set-Cookie",
    "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax"
  );
  response.headers.append(
    "Set-Cookie",
    "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Strict"
  );
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");

  return response;
}

export async function GET(request: NextRequest) {
  await deleteSession();
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("admin_session");

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.headers.set(
    "Set-Cookie",
    "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax"
  );
  response.headers.append(
    "Set-Cookie",
    "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Strict"
  );
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}
