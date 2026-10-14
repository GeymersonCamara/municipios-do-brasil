"use client";

import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export type FeedItem = {
  id: string;
  createdAt: string;
  user: { id: string; name: string };
  municipality: {
    ibgeCode: string;
    name: string;
    stateCode: string;
    stateName: string;
  };
  hasPhoto: boolean;
  photoUrl: string | null;
  description: string | null;
  isYou: boolean;
};

type FeedPage = {
  canSeePhotos: boolean;
  items: FeedItem[];
  nextCursor: string | null;
};

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params = new URLSearchParams({ limit: "5" });
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar o feed");
      return res.json();
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useFeedPostActions() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async ({
      ibgeCode,
      description,
    }: {
      ibgeCode: string;
      description: string;
    }) => {
      const res = await fetch(`/api/visited/${ibgeCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Falha ao editar a publicação");
      }
      return res.json() as Promise<{ description: string | null }>;
    },
    onSuccess: () => {
      toast.success("Publicação atualizada");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["visited"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (visitId: string) => {
      const res = await fetch(`/api/feed/${visitId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Falha ao apagar a publicação");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Publicação apagada");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["visited"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    saveDescription: (ibgeCode: string, description: string) =>
      save.mutateAsync({ ibgeCode, description }),
    deletePost: (visitId: string) => remove.mutateAsync(visitId),
    isSaving: save.isPending,
    isDeleting: remove.isPending,
  };
}
