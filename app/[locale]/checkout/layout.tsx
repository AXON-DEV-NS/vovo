import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { Logo } from "@/components/ui/logo";
import { Lock } from "lucide-react";

export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  // Subscriptions must be tied to a real account — guests go to Sign Up first.
  const session = await getSession();
  if (!session) {
    redirect("/login?mode=signup");
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-high">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-mute">
            <Lock className="h-3.5 w-3.5 text-green-600" />
            Secure checkout
          </span>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
