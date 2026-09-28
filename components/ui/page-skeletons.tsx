import { Skeleton } from "@/components/ui/loading-skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

/**
 * Shared content-area skeletons.
 *
 * These replace full-area spinners: the layout keeps its shape while real
 * data arrives, so nothing jumps and nothing overlaps on small screens.
 */

export function DashboardHomeSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-line bg-paper-high p-5 shadow-soft"
          >
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-paper-high p-6 shadow-soft lg:col-span-2">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="rounded-2xl border border-line bg-paper-high p-6 shadow-soft">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function AdminPanelSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-line bg-paper-high p-6 shadow-soft"
          >
            <Skeleton className="mb-3 h-4 w-28" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-line bg-paper-high shadow-soft">
        <div className="border-b border-line p-6">
          <Skeleton className="h-5 w-52 max-w-full" />
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div className="grid grid-cols-7 auto-rows-[110px]" aria-hidden="true">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="border-b border-r border-paper-low p-2">
          <Skeleton className="mb-2 ml-auto h-3.5 w-5" />
          {i % 4 === 1 && <Skeleton className="h-5 w-full" />}
          {i % 7 === 3 && <Skeleton className="mt-1 h-5 w-4/5" />}
        </div>
      ))}
    </div>
  );
}

export function MessageThreadSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="ml-auto h-16 w-4/5 rounded-2xl" />
      <Skeleton className="h-24 w-5/6 rounded-2xl" />
      <Skeleton className="ml-auto h-14 w-3/5 rounded-2xl" />
    </div>
  );
}

/** Table body rows (must be rendered inside TableBody). */
export function TableSkeletonRows({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <TableCell key={c}>
              <Skeleton className={c === 0 ? "h-4 w-4/5" : "h-4 w-3/4"} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function ListRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}
