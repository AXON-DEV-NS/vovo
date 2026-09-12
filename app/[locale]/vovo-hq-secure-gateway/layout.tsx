import { type ReactNode } from "react";

/**
 * Root layout for the hidden admin gateway. Minimal — the login page
 * renders its own full-screen treatment; panel pages are wrapped by
 * the protected (panel) layout.
 */
export default function AdminGatewayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
