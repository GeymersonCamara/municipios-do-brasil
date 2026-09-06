"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PhotoDialogMunicipality = {
  ibgeCode: string;
  name: string;
  stateName?: string;
  stateCode?: string;
};

type MunicipalityPhotoDialogProps = {
  open: boolean;
  municipality: PhotoDialogMunicipality | null;
  visited: boolean;
  hasPhoto: boolean;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkVisited: () => Promise<void> | void;
  onUnmarkVisited: () => Promise<void> | void;
  onUpload: (file: File) => Promise<void> | void;
  onRemovePhoto: () => Promise<void> | void;
};

export function MunicipalityPhotoDialog({
  open,
  municipality,
  visited,
  hasPhoto,
  busy,
  onOpenChange,
  onMarkVisited,
  onUnmarkVisited,
  onUpload,
  onRemovePhoto,
}: MunicipalityPhotoDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);

  useEffect(() => {
    if (!open || !municipality || !hasPhoto) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(
      `/api/visited/${municipality.ibgeCode}/photo?t=${photoVersion}`,
    );
  }, [open, municipality, hasPhoto, photoVersion]);

  useEffect(() => {
    if (open) setPhotoVersion((value) => value + 1);
  }, [open, hasPhoto]);

  if (!municipality) return null;

  const location = [municipality.stateName, municipality.stateCode]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{municipality.name}</DialogTitle>
          <DialogDescription>
            {location
              ? `${location}. Adicione uma foto da sua visita.`
              : "Adicione uma foto da sua visita."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
            {visited && hasPhoto && previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={`Foto de ${municipality.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
                <Camera className="h-8 w-8 opacity-60" />
                <p>
                  {visited
                    ? "Nenhuma foto ainda. Envie uma imagem JPEG, PNG ou WebP (até 5 MB)."
                    : "Marque o município como visitado para liberar o envio de foto."}
                </p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              await onUpload(file);
              setPhotoVersion((value) => value + 1);
            }}
          />
        </div>

        <DialogFooter>
          {visited ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => onUnmarkVisited()}
              >
                <Trash2 className="h-4 w-4" />
                Remover visita
              </Button>
              {hasPhoto && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => onRemovePhoto()}
                >
                  Remover foto
                </Button>
              )}
              <Button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                {hasPhoto ? "Trocar foto" : "Adicionar foto"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={busy}
              onClick={() => onMarkVisited()}
            >
              Marcar como visitado
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
