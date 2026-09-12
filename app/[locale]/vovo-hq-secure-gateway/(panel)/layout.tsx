import { type ReactNode } from "react";
import { getAdminSession } from "@/lib/auth/admin-session";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Server-side gate for every admin panel page. Any request without a
 * valid ADMIN session is redirected to the homepage — the panel behaves
 * as if it doesn't exist for everyone except the owner.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
