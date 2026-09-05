"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MunicipalitySummary } from "@/types/map";

export function useMunicipalitySearch(query: string, enabled = true) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const searchEnabled = enabled && debounced.length >= 2;

  const result = useQuery({
    queryKey: ["municipality-search", debounced],
    enabled: searchEnabled,
    queryFn: async (): Promise<MunicipalitySummary[]> => {
      const params = new URLSearchParams({ q: debounced, limit: "12" });
      const res = await fetch(`/api/municipalities?${params}`);
      if (!res.ok) throw new Error("Falha na busca");
      const data = (await res.json()) as {
        municipalities: MunicipalitySummary[];
      };
      return data.municipalities;
    },
  });

  return useMemo(
    () => ({
      ...result,
      debouncedQuery: debounced,
      isSearching: searchEnabled && result.isFetching,
    }),
    [result, debounced, searchEnabled],
  );
}
