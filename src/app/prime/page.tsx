import { Suspense } from "react";
import { PrimePageView } from "@/components/prime/prime-page-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrimePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <PrimePageView />
    </Suspense>
  );
}
