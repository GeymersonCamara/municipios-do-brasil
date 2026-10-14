"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type VisitComment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; isYou: boolean };
  replies?: VisitComment[];
};

async function fetchComments(visitId: string): Promise<VisitComment[]> {
  const res = await fetch(`/api/feed/${visitId}/comments`);
  if (!res.ok) throw new Error("Falha ao carregar comentários");
  const data = (await res.json()) as { comments: VisitComment[] };
  return data.comments;
}

export function useVisitComments(visitId: string | null | undefined) {
  const queryClient = useQueryClient();
  const enabled = Boolean(visitId);

  const query = useQuery({
    queryKey: ["visit-comments", visitId],
    queryFn: () => fetchComments(visitId as string),
    enabled,
  });

  const create = useMutation({
    mutationFn: async ({
      body,
      parentId,
    }: {
      body: string;
      parentId?: string;
    }) => {
      const res = await fetch(`/api/feed/${visitId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Falha ao comentar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit-comments", visitId] });
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addComment: (body: string, parentId?: string) =>
      create.mutateAsync({ body, parentId }),
    isPosting: create.isPending,
  };
}
