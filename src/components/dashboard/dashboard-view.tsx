"use client";

import { MapExplorer } from "@/components/map/map-explorer";
import { ScopeControls } from "@/components/map/scope-controls";
import { MunicipalitySearch } from "@/components/search/municipality-search";
import { StatsPanel } from "@/components/stats/stats-panel";
import { useMapScope } from "@/hooks/useMapScope";
import { useStats } from "@/hooks/useStats";
import { useVisitedMunicipalities } from "@/hooks/useVisitedMunicipalities";

export function DashboardView() {
  const {
    scope,
    goBrazil,
    goRegion,
    goState,
    highlightCode,
    setHighlightCode,
  } = useMapScope();
  const { visitedSet, toggleVisited, isLoading: visitedLoading } =
    useVisitedMunicipalities();
  const { data: stats, isLoading: statsLoading } = useStats(scope);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <ScopeControls
          scope={scope}
          onBrazil={goBrazil}
          onRegion={goRegion}
          onState={goState}
        />
        <StatsPanel stats={stats} isLoading={statsLoading || visitedLoading} />
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Como usar</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>No Brasil/região, clique em um estado para entrar.</li>
            <li>No estado, clique no município para marcar visitado.</li>
            <li>Use a busca para marcar sem clicar no mapa.</li>
          </ul>
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col gap-3">
        <MunicipalitySearch
          visitedSet={visitedSet}
          onSelect={(muni) => {
            goState(muni.stateCode);
            setHighlightCode(muni.ibgeCode);
          }}
          onToggleVisited={toggleVisited}
        />
        <div className="min-h-0 flex-1">
          <MapExplorer
            scope={scope}
            visitedSet={visitedSet}
            highlightCode={highlightCode}
            onStateSelect={goState}
            onMunicipalityToggle={toggleVisited}
          />
        </div>
      </section>
    </div>
  );
}
