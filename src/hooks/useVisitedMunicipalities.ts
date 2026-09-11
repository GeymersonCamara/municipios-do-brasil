"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export type VisitedItem = {
  ibgeCode: string;
  visitedAt: string;
  hasPhoto: boolean;
};

async function fetchVisited(): Promise<VisitedItem[]> {
  const res = await fetch("/api/visited");
  if (!res.ok) throw new Error("Falha ao carregar municípios visitados");
  const data = (await res.json()) as {
    items?: VisitedItem[];
    codes?: string[];
  };
  if (data.items) return data.items;
  return (data.codes ?? []).map((ibgeCode) => ({
    ibgeCode,
    visitedAt: new Date().toISOString(),
    hasPhoto: false,
  }));
}

export function useVisitedMunicipalities() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["visited"],
    queryFn: fetchVisited,
  });

  const items = query.data ?? [];
  const visitedSet = new Set(items.map((item) => item.ibgeCode));
  const photoSet = new Set(
    items.filter((item) => item.hasPhoto).map((item) => item.ibgeCode),
  );

  const toggle = useMutation({
    mutationFn: async (ibgeCode: string) => {
      const res = await fetch("/api/visited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ibgeCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Falha ao atualizar município");
      }
      return (await res.json()) as {
        visited: boolean;
        ibgeCode: string;
        hasPhoto: boolean;
      };
    },
    onMutate: async (ibgeCode) => {
      await queryClient.cancelQueries({ queryKey: ["visited"] });
      const previous = queryClient.getQueryData<VisitedItem[]>(["visited"]) ?? [];
      const exists = previous.some((item) => item.ibgeCode === ibgeCode);
      const next = exists
        ? previous.filter((item) => item.ibgeCode !== ibgeCode)
        : [
            ...previous,
            {
              ibgeCode,
              visitedAt: new Date().toISOString(),
              hasPhoto: false,
            },
          ];
      queryClient.setQueryData(["visited"], next);
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["visited"], context.previous);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["visited"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({
      ibgeCode,
      file,
    }: {
      ibgeCode: string;
      file: File;
    }) => {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`/api/visited/${ibgeCode}/photo`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Falha ao enviar foto");
      }
      return res.json() as Promise<{
        ibgeCode: string;
        hasPhoto: boolean;
        photoUrl: string;
      }>;
    },
    onSuccess: () => {
      toast.success("Foto salva");
      queryClient.invalidateQueries({ queryKey: ["visited"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const removePhoto = useMutation({
    mutationFn: async (ibgeCode: string) => {
      const res = await fetch(`/api/visited/${ibgeCode}/photo`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Falha ao remover foto");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Foto removida");
      queryClient.invalidateQueries({ queryKey: ["visited"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    visitedItems: items,
    visitedCodes: items.map((item) => item.ibgeCode),
    visitedSet,
    photoSet,
    isLoading: query.isLoading,
    isError: query.isError,
    toggleVisited: (ibgeCode: string) => toggle.mutateAsync(ibgeCode),
    isToggling: toggle.isPending,
    uploadPhoto: (ibgeCode: string, file: File) =>
      uploadPhoto.mutateAsync({ ibgeCode, file }),
    isUploadingPhoto: uploadPhoto.isPending,
    removePhoto: (ibgeCode: string) => removePhoto.mutateAsync(ibgeCode),
    isRemovingPhoto: removePhoto.isPending,
  };
}
