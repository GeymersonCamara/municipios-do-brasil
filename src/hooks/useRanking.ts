"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const canAccess = Boolean(session?.user?.isPrime);
  const stateCode = scope.level === "state" ? scope.stateCode : null;

  const query = useQuery({
    queryKey: ["ranking", stateCode],
    enabled: status === "authenticated" && canAccess,
    queryFn: async (): Promise<RankingPayload> => {
      const params = new URLSearchParams();
      if (stateCode) params.set("stateCode", stateCode);
      const qs = params.toString();
      const res = await fetch(`/api/ranking${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Falha ao carregar ranking");
      }
      return res.json();
    },
  });

  return {
    ...query,
    canAccess,
    sessionLoading: status === "loading",
  };
}
