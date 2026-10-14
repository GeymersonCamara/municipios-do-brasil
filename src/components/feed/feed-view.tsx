"use client";

import Link from "next/link";
import { MapPinned, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BecomePrimeButton } from "@/components/prime/become-prime-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitThread } from "@/components/feed/visit-thread";
import { useFeed, useFeedPostActions, type FeedItem } from "@/hooks/useFeed";
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

function PostMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="absolute right-2 top-2">
      <button
        type="button"
        aria-label="Opções da publicação"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border bg-card py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Apagar
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FeedCard({
  item,
  canSeePhotos,
}: {
  item: FeedItem;
  canSeePhotos: boolean;
}) {
  const { saveDescription, deletePost, isSaving, isDeleting } =
    useFeedPostActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.description ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(item.description ?? "");
  }, [editing, item.description]);

  return (
    <article className="relative rounded-xl border bg-card p-4 shadow-sm">
      {item.isYou ? (
        <PostMenu
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirmDelete(true)}
        />
      ) : null}
      <div className="flex items-start gap-3 pr-8">
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
                  <p className="max-w-[18rem] text-sm font-semibold leading-snug">
                    Foto + roteiro + dicas locais. Tudo com o Prime.
                  </p>
                  <BecomePrimeButton
                    label="Assinar Prime"
                    size="sm"
                    className="bg-white text-foreground hover:bg-white/90"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {editing ? (
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault();
                await saveDescription(item.municipality.ibgeCode, draft);
                setEditing(false);
              }}
            >
              <label className="text-sm font-medium" htmlFor={`edit-${item.id}`}>
                Descrição da viagem
              </label>
              <textarea
                id={`edit-${item.id}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Conte como foi a viagem e dê dicas para outros viajantes."
                className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  Salvar
                </Button>
              </div>
            </form>
          ) : item.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {item.description}
            </p>
          ) : null}

          <Link
            href={`/dashboard?state=${item.municipality.stateCode}&highlight=${item.municipality.ibgeCode}`}
            className="inline-flex text-xs font-medium text-visited hover:underline"
          >
            Ver no mapa
          </Link>
        </div>
      </div>
      <VisitThread visitId={item.id} />
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar publicação</DialogTitle>
            <DialogDescription>
              A visita a {item.municipality.name} sai do mapa e do feed, junto
              com a foto, a descrição e os comentários.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setConfirmDelete(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                await deletePost(item.id);
                setConfirmDelete(false);
              }}
            >
              Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function FeedScrollLoader({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    fetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        fetchNextPage();
      },
      { rootMargin: "280px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (!hasNextPage && !isFetchingNextPage) return null;

  return (
    <div
      ref={sentinelRef}
      className="flex justify-center py-6"
      aria-live="polite"
    >
      {isFetchingNextPage ? (
        <div className="w-full space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <p className="text-center text-sm text-muted-foreground">
            Carregando mais publicações…
          </p>
        </div>
      ) : (
        <span className="sr-only">Mais publicações abaixo</span>
      )}
    </div>
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
    <div className="mx-auto w-full max-w-xl space-y-4 px-3 py-4 sm:px-4 sm:py-6">
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
          <FeedScrollLoader
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={() => {
              void fetchNextPage();
            }}
          />
        </>
      )}
    </div>
  );
}
