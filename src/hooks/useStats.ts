"use client";

import { useQuery } from "@tanstack/react-query";
import type { MapScope } from "@/types/map";
import type { StatsPayload } from "@/types/map";

function scopeToParams(scope: MapScope) {
  const params = new URLSearchParams({ level: scope.level });
  if (scope.level === "region") params.set("region", scope.region);
  if (scope.level === "state") params.set("stateCode", scope.stateCode);
  return params;
}

export function useStats(scope: MapScope) {
  return useQuery({
    queryKey: ["stats", scope],
    queryFn: async (): Promise<StatsPayload> => {
      const res = await fetch(`/api/stats?${scopeToParams(scope)}`);
      if (!res.ok) throw new Error("Falha ao carregar estatísticas");
      return res.json();
    },
  });
}
