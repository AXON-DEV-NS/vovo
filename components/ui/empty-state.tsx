import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Inbox } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 rounded-2xl bg-paper-low p-4">
        {icon || <Inbox className="h-8 w-8 text-ink-faint" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-ink">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-ink-mute">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary" size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
