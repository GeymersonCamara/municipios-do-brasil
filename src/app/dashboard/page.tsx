import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-page">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-6">
              <Skeleton className="h-[70vh] w-full rounded-xl" />
            </div>
          }
        >
          <DashboardView />
        </Suspense>
      </main>
    </>
  );
}
