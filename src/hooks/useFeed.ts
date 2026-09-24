"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

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
  isYou: boolean;
};

type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params = new URLSearchParams({ limit: "20" });
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar o feed");
      return res.json();
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}
