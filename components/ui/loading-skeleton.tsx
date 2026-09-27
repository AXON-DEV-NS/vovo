import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-line",
        className
      )}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-paper-high p-6 shadow-soft">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-paper-high p-6 shadow-soft">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, StatCardSkeleton, TableRowSkeleton };
