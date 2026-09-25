"use client";

import { Lock, Trophy } from "lucide-react";
import { BecomePrimeButton } from "@/components/prime/become-prime-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPercent } from "@/lib/utils";
import type { RankingBoard, RankingEntry } from "@/hooks/useRanking";

function medalClass(rank: number) {
  if (rank === 1) return "bg-amber-500/15 text-amber-800";
  if (rank === 2) return "bg-slate-400/20 text-slate-700";
  if (rank === 3) return "bg-orange-700/15 text-orange-900";
  return "bg-muted text-muted-foreground";
}

function RankingList({
  board,
  emptyHint,
}: {
  board: RankingBoard;
  emptyHint: string;
}) {
  if (board.items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyHint}</p>;
  }

  return (
    <ol className="space-y-2">
      {board.items.map((entry) => (
        <RankingRow key={entry.userId} entry={entry} />
      ))}
    </ol>
  );
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm",
        entry.isYou && "border-visited/40 bg-visited/10",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          medalClass(entry.rank),
        )}
      >
        {entry.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {entry.name}
          {entry.isYou ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (você)
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.visited} municípios · {formatPercent(entry.percent)}
        </p>
      </div>
    </li>
  );
}

type RankingPanelProps = {
  brazil?: RankingBoard;
  state?: RankingBoard | null;
  isLoading?: boolean;
  showStateHint?: boolean;
  canAccess?: boolean;
};

export function RankingPanel({
  brazil,
  state,
  isLoading,
  showStateHint,
  canAccess = true,
}: RankingPanelProps) {
  if (!canAccess) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-600" />
            Ranking Top 5
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Recurso Prime</p>
              <p className="mt-1 text-xs text-muted-foreground">
                O ranking de quem mais conheceu o Brasil e cada estado é
                exclusivo para assinantes Prime e admins.
              </p>
            </div>
          </div>
          <BecomePrimeButton
            className="w-full bg-visited text-white hover:bg-visited-hover"
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !brazil) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {state ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-600" />
              Top 5 — {state.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingList
              board={state}
              emptyHint="Ainda não há visitas registradas neste estado."
            />
          </CardContent>
        </Card>
      ) : showStateHint ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-600" />
              Ranking por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Entre em um estado no mapa para ver o Top 5 de quem mais conheceu
              aquela UF.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-600" />
            Top 5 — Brasil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RankingList
            board={brazil}
            emptyHint="Ainda não há visitas registradas no país."
          />
        </CardContent>
      </Card>
    </div>
  );
}
