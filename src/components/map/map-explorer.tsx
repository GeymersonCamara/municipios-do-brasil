"use client";

import type { MapScope } from "@/types/map";
import { BrazilMap, BrazilMapSkeleton } from "@/components/map/brazil-map";
import { useMapGeography } from "@/hooks/useMapGeography";
import { Button } from "@/components/ui/button";

type MapExplorerProps = {
  scope: MapScope;
  visitedSet: Set<string>;
  photoSet?: Set<string>;
  highlightCode?: string | null;
  onStateSelect: (stateCode: string) => void;
  onMunicipalitySelect: (ibgeCode: string, name: string) => void;
};

export function MapExplorer({
  scope,
  visitedSet,
  photoSet,
  highlightCode,
  onStateSelect,
  onMunicipalitySelect,
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
      photoSet={photoSet}
      highlightCode={highlightCode}
      onFeatureClick={(id, name) => {
        if (isState) onMunicipalitySelect(id, name);
        else onStateSelect(id);
      }}
    />
  );
}
