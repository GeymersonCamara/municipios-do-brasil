"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { MapPinned, Menu, X } from "lucide-react";
import { BecomePrimeButton } from "@/components/prime/become-prime-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Feed" },
  { href: "/dashboard", label: "Mapa" },
  { href: "/perfil", label: "Perfil" },
] as const;

export function AppHeader() {
  const { data } = useSession();
  const pathname = usePathname();
  const isPrime = Boolean(data?.user?.isPrime);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-semibold"
        >
          <MapPinned className="h-5 w-5 shrink-0 text-visited" aria-hidden />
          <span className="truncate">Visitados</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex md:gap-2">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-2 py-1 hover:bg-accent",
                  active && "bg-accent font-medium",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {!isPrime && pathname !== "/prime" ? (
            <BecomePrimeButton size="sm" variant="outline" />
          ) : null}
          {isPrime ? (
            <Link
              href="/prime"
              className={cn(
                "rounded-md px-2 py-1 hover:bg-accent",
                pathname.startsWith("/prime") && "bg-accent font-medium",
              )}
            >
              Prime
            </Link>
          ) : null}
          {data?.user?.name ? (
            <span className="max-w-[10rem] truncate text-muted-foreground">
              {data.user.name}
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sair
          </Button>
        </nav>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen ? (
        <div className="border-t bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-3 py-3 text-sm">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2.5 hover:bg-accent",
                    active && "bg-accent font-medium",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {isPrime ? (
              <Link
                href="/prime"
                className={cn(
                  "rounded-md px-3 py-2.5 hover:bg-accent",
                  pathname.startsWith("/prime") && "bg-accent font-medium",
                )}
              >
                Prime
              </Link>
            ) : pathname !== "/prime" ? (
              <BecomePrimeButton
                className="mt-1 w-full justify-center"
                variant="outline"
              />
            ) : null}
            {data?.user?.name ? (
              <p className="px-3 py-1 text-xs text-muted-foreground">
                {data.user.name}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="mt-1 w-full"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sair
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
