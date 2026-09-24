import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { FeedView } from "@/components/feed/feed-view";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-page">
        <FeedView />
      </main>
    </>
  );
}
