"use client";

import Link from "next/link";
import { Lock, MapPinned } from "lucide-react";
import { BecomePrimeButton } from "@/components/prime/become-prime-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed, type FeedItem } from "@/hooks/useFeed";
import { formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function FeedCard({
  item,
  canSeePhotos,
}: {
  item: FeedItem;
  canSeePhotos: boolean;
}) {
  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            item.isYou
              ? "bg-visited/20 text-visited"
              : "bg-secondary text-secondary-foreground",
          )}
          aria-hidden
        >
          {initials(item.user.name) || "?"}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm leading-snug">
              <span className="font-semibold">{item.user.name}</span>
              {" conheceu "}
              <span className="font-semibold">{item.municipality.name}</span>
              <span className="text-muted-foreground">
                {" "}
                · {item.municipality.stateName}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeTime(item.createdAt)}
            </p>
          </div>

          {item.hasPhoto && item.photoUrl ? (
            <div className="relative overflow-hidden rounded-lg border bg-muted/40">
              <img
                src={item.photoUrl}
                alt={
                  canSeePhotos
                    ? `Foto de ${item.municipality.name}`
                    : "Foto bloqueada para assinantes Prime"
                }
                className={cn(
                  "max-h-[420px] w-full object-cover transition",
                  !canSeePhotos && "scale-110 blur-2xl",
                )}
                loading="lazy"
                draggable={canSeePhotos}
              />
              {!canSeePhotos ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 px-4 text-center text-white">
                  <Lock className="h-5 w-5 opacity-90" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">Foto exclusiva Prime</p>
                    <p className="mx-auto mt-1 max-w-[16rem] text-xs text-white/85">
                      Assine o Visitados Prime para ver as fotos do feed com
                      nitidez.
                    </p>
                  </div>
                  <BecomePrimeButton
                    size="sm"
                    className="bg-white text-foreground hover:bg-white/90"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            href={`/dashboard?state=${item.municipality.stateCode}&highlight=${item.municipality.ibgeCode}`}
            className="inline-flex text-xs font-medium text-visited hover:underline"
          >
            Ver no mapa
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeedView() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed();

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const canSeePhotos = data?.pages[0]?.canSeePhotos ?? false;

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Feed
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quando alguém marca um município, a postagem aparece aqui
          automaticamente.
          {!canSeePhotos && !isLoading
            ? " Fotos do feed ficam nítidas no Visitados Prime."
            : null}
        </p>
        {!canSeePhotos && !isLoading ? (
          <BecomePrimeButton className="mt-3" size="sm" />
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
          Não foi possível carregar o feed.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <MapPinned className="mx-auto h-8 w-8 text-visited" aria-hidden />
          <p className="mt-3 font-medium">Nenhuma postagem ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Marque um município no mapa para gerar a primeira postagem.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Abrir mapa</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                canSeePhotos={canSeePhotos}
              />
            ))}
          </div>
          {hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
