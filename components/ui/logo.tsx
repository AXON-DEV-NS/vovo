import { cn } from "@/lib/cn";

interface LogoProps {
  variant?: "ink" | "paper";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Show only the mark — used by collapsed sidebars */
  markOnly?: boolean;
}

const SIZES = {
  sm: { mark: "h-7 w-7 rounded-md", text: "text-sm" },
  md: { mark: "h-9 w-9 rounded-lg", text: "text-lg" },
  lg: { mark: "h-16 w-16 rounded-xl", text: "text-2xl" },
} as const;

/**
 * VOVO Agent AI — the site logo.
 * Uses the official mark (public/vovo25.jpg) with the wordmark.
 */
export function Logo({
  variant = "ink",
  size = "md",
  className,
  markOnly = false,
}: LogoProps) {
  const s = SIZES[size];
  const isInk = variant === "ink";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/vovo25.jpg"
        alt="VOVO Agent AI logo"
        width={512}
        height={512}
        className={cn("shrink-0 object-contain", s.mark)}
      />
      {!markOnly && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            s.text,
            isInk ? "text-ink" : "text-paper-high"
          )}
        >
          VOVO{" "}
          <span className={cn("font-normal", isInk ? "text-ink-mute" : "text-paper/60")}>
            Agent AI
          </span>
        </span>
      )}
    </span>
  );
}
