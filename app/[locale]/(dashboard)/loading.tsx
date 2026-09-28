import { DashboardHomeSkeleton } from "@/components/ui/page-skeletons";

/**
 * Route-level skeleton for every dashboard page while its data loads.
 * Replaces full-page spinners — the shell keeps its shape, nothing jumps.
 */
export default function DashboardLoading() {
  return <DashboardHomeSkeleton />;
}
