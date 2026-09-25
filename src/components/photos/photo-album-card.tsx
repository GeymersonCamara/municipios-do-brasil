"use client";

import { Images } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BecomePrimeButton } from "@/components/prime/become-prime-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hasPrimeAccess } from "@/lib/access";

type AlbumItem = {
  ibgeCode: string;
  name: string;
  stateName: string;
  stateCode: string;
  visitedAt: string;
};

export function PhotoAlbumCard() {
  const { data: session } = useSession();
  const prime = hasPrimeAccess(session?.user?.email);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !prime) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/album")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.message ?? data.error ?? "Não foi possível carregar o álbum",
          );
        }
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar");
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, prime]);

  return (
    <>
      <div className="rounded-xl border bg-card p-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          <Images className="h-4 w-4" />
          Meu álbum de fotos
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={prime ? "max-w-3xl" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>
              {prime ? "Meu álbum de fotos" : "Recurso Prime"}
            </DialogTitle>
            <DialogDescription>
              {prime
                ? "Todas as fotos que você salvou nos municípios visitados."
                : "O álbum de fotos é exclusivo do Visitados Prime."}
            </DialogDescription>
          </DialogHeader>

          {!prime ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Com o Prime você vê todas as fotos dos municípios visitados em
                um só lugar, além das fotos nítidas no feed e dos próximos
                recursos exclusivos.
              </p>
              <BecomePrimeButton
                className="w-full bg-visited text-white hover:bg-visited-hover"
                onClick={() => setOpen(false)}
              />
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Carregando álbum…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não tem fotos salvas. Marque um município e adicione
              uma foto pelo mapa.
            </p>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {items.map((item) => (
                <figure
                  key={item.ibgeCode}
                  className="overflow-hidden rounded-lg border bg-muted/30"
                >
                  <img
                    src={`/api/visited/${item.ibgeCode}/photo`}
                    alt={`Foto de ${item.name}`}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <figcaption className="space-y-0.5 p-2 text-xs">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-muted-foreground">
                      {item.stateName} ({item.stateCode})
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
