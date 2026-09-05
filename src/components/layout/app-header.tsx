"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { data } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <MapPinned className="h-5 w-5 text-visited" aria-hidden />
          <span>Visitados</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md px-2 py-1 hover:bg-accent"
          >
            Mapa
          </Link>
          <Link href="/perfil" className="rounded-md px-2 py-1 hover:bg-accent">
            Perfil
          </Link>
          {data?.user?.name && (
            <span className="hidden text-muted-foreground sm:inline">
              {data.user.name}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
}
