"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

async function fetchVisited(): Promise<string[]> {
  const res = await fetch("/api/visited");
  if (!res.ok) throw new Error("Falha ao carregar municípios visitados");
  const data = (await res.json()) as { codes: string[] };
  return data.codes;
}

export function useVisitedMunicipalities() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["visited"],
    queryFn: fetchVisited,
  });

  const visitedSet = new Set(query.data ?? []);

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
      return (await res.json()) as { visited: boolean; ibgeCode: string };
    },
    onMutate: async (ibgeCode) => {
      await queryClient.cancelQueries({ queryKey: ["visited"] });
      const previous = queryClient.getQueryData<string[]>(["visited"]) ?? [];
      const exists = previous.includes(ibgeCode);
      const next = exists
        ? previous.filter((code) => code !== ibgeCode)
        : [...previous, ibgeCode];
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
    },
  });

  return {
    visitedCodes: query.data ?? [],
    visitedSet,
    isLoading: query.isLoading,
    isError: query.isError,
    toggleVisited: (ibgeCode: string) => toggle.mutate(ibgeCode),
    isToggling: toggle.isPending,
  };
}
