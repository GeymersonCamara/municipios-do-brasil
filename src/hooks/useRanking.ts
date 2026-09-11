"use client";

import { useQuery } from "@tanstack/react-query";
import type { MapScope } from "@/types/map";

export type RankingEntry = {
  rank: number;
  userId: string;
  name: string;
  visited: number;
  percent: number;
  isYou: boolean;
};

export type RankingBoard = {
  scope: "brazil" | "state";
  label: string;
  totalMunicipalities: number;
  items: RankingEntry[];
};

export type RankingPayload = {
  brazil: RankingBoard;
  state: RankingBoard | null;
};

export function useRanking(scope: MapScope) {
  const stateCode = scope.level === "state" ? scope.stateCode : null;

  return useQuery({
    queryKey: ["ranking", stateCode],
    queryFn: async (): Promise<RankingPayload> => {
      const params = new URLSearchParams();
      if (stateCode) params.set("stateCode", stateCode);
      const qs = params.toString();
      const res = await fetch(`/api/ranking${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar ranking");
      return res.json();
    },
  });
}
