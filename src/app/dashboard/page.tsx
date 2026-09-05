import { AppHeader } from "@/components/layout/app-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-page">
        <DashboardView />
      </main>
    </>
  );
}
