"use client";

import { Images } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hasPlusAccess } from "@/lib/access";

type AlbumItem = {
  ibgeCode: string;
  name: string;
  stateName: string;
  stateCode: string;
  visitedAt: string;
};

export function PhotoAlbumCard() {
  const { data: session } = useSession();
  const plus = hasPlusAccess(session?.user?.email);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !plus) return;

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
  }, [open, plus]);

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
        <DialogContent className={plus ? "max-w-3xl" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>
              {plus ? "Meu álbum de fotos" : "Recurso Plus"}
            </DialogTitle>
            <DialogDescription>
              {plus
                ? "Todas as fotos que você salvou nos municípios visitados."
                : "O álbum de fotos é um recurso Plus e será liberado posteriormente."}
            </DialogDescription>
          </DialogHeader>

          {!plus ? (
            <p className="text-sm text-muted-foreground">
              Em breve você poderá ver aqui, em um só lugar, todas as fotos dos
              municípios que visitou. Fique de olho nas novidades do Visitados
              Plus.
            </p>
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
