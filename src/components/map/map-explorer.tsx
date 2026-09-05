"use client";

import type { MapScope } from "@/types/map";
import { BrazilMap, BrazilMapSkeleton } from "@/components/map/brazil-map";
import { useMapGeography } from "@/hooks/useMapGeography";
import { Button } from "@/components/ui/button";

type MapExplorerProps = {
  scope: MapScope;
  visitedSet: Set<string>;
  highlightCode?: string | null;
  onStateSelect: (stateCode: string) => void;
  onMunicipalityToggle: (ibgeCode: string) => void;
};

export function MapExplorer({
  scope,
  visitedSet,
  highlightCode,
  onStateSelect,
  onMunicipalityToggle,
}: MapExplorerProps) {
  const { data: geo, isLoading, isError, error, refetch, isFetching } =
    useMapGeography(scope);

  if (isLoading || (isFetching && !geo)) {
    return <BrazilMapSkeleton />;
  }

  if (isError || !geo) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Erro ao carregar mapa"}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const isState = scope.level === "state";

  return (
    <BrazilMap
      geography={geo}
      mode={isState ? "municipalities" : "states"}
      visitedSet={visitedSet}
      highlightCode={highlightCode}
      onFeatureClick={(id) => {
        if (isState) onMunicipalityToggle(id);
        else onStateSelect(id);
      }}
    />
  );
}
