"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/utils";
import type { StatsPayload } from "@/types/map";

type StatsPanelProps = {
  stats?: StatsPayload;
  isLoading?: boolean;
};

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (stats.percent / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Cobertura — {stats.scopeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="relative h-24 w-24 shrink-0"
            role="img"
            aria-label={`${formatPercent(stats.percent)} visitado`}
          >
            <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-secondary"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="text-visited transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {formatPercent(stats.percent)}
            </div>
          </div>

          <div className="min-w-0 space-y-1 text-sm">
            <p>
              <span className="text-2xl font-semibold tabular-nums">
                {stats.visited}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {stats.total} municípios
              </span>
            </p>
            <p className="text-muted-foreground">
              {stats.visited === 0
                ? "Nenhum município marcado ainda neste escopo."
                : "Atualiza automaticamente ao mudar o escopo."}
            </p>
          </div>
        </div>

        <Progress value={stats.percent} aria-label="Progresso de cobertura" />
      </CardContent>
    </Card>
  );
}
