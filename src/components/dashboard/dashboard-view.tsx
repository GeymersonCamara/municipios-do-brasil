"use client";

import { useMemo, useState } from "react";
import { MapExplorer } from "@/components/map/map-explorer";
import { ScopeControls } from "@/components/map/scope-controls";
import {
  MunicipalityPhotoDialog,
  type PhotoDialogMunicipality,
} from "@/components/photos/municipality-photo-dialog";
import { PhotoAlbumCard } from "@/components/photos/photo-album-card";
import { MunicipalitySearch } from "@/components/search/municipality-search";
import { RankingPanel } from "@/components/stats/ranking-panel";
import { StatsPanel } from "@/components/stats/stats-panel";
import { useMapGeography } from "@/hooks/useMapGeography";
import { useMapScope } from "@/hooks/useMapScope";
import { useRanking } from "@/hooks/useRanking";
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
  const {
    visitedSet,
    photoSet,
    toggleVisited,
    uploadPhoto,
    removePhoto,
    isLoading: visitedLoading,
    isToggling,
    isUploadingPhoto,
    isRemovingPhoto,
  } = useVisitedMunicipalities();
  const { data: stats, isLoading: statsLoading } = useStats(scope);
  const { data: ranking, isLoading: rankingLoading } = useRanking(scope);
  const { data: geo } = useMapGeography(scope);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PhotoDialogMunicipality | null>(
    null,
  );

  const nameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const feature of geo?.features ?? []) {
      const code = String(feature.properties?.codarea ?? feature.id ?? "");
      const name = String(feature.properties?.name ?? code);
      if (code) map.set(code, name);
    }
    return map;
  }, [geo]);

  function openMunicipalityDialog(muni: PhotoDialogMunicipality) {
    setSelected(muni);
    setHighlightCode(muni.ibgeCode);
    setDialogOpen(true);
  }

  const busy = isToggling || isUploadingPhoto || isRemovingPhoto;
  const selectedVisited = selected
    ? visitedSet.has(selected.ibgeCode)
    : false;
  const selectedHasPhoto = selected
    ? photoSet.has(selected.ibgeCode)
    : false;

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[280px_1fr_260px]">
      <aside className="space-y-4">
        <ScopeControls
          scope={scope}
          onBrazil={goBrazil}
          onRegion={goRegion}
          onState={goState}
        />
        <StatsPanel stats={stats} isLoading={statsLoading || visitedLoading} />
        <PhotoAlbumCard />
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Como usar</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>No Brasil/região, clique em um estado para entrar.</li>
            <li>No estado, clique no município para marcar e adicionar foto.</li>
            <li>Municípios com foto ficam com contorno mais destacado.</li>
          </ul>
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col gap-3">
        <MunicipalitySearch
          visitedSet={visitedSet}
          photoSet={photoSet}
          onSelect={(muni) => {
            goState(muni.stateCode);
            openMunicipalityDialog({
              ibgeCode: muni.ibgeCode,
              name: muni.name,
              stateName: muni.stateName,
              stateCode: muni.stateCode,
            });
          }}
          onOpenDetails={(muni) => {
            openMunicipalityDialog({
              ibgeCode: muni.ibgeCode,
              name: muni.name,
              stateName: muni.stateName,
              stateCode: muni.stateCode,
            });
          }}
          onToggleVisited={async (ibgeCode) => {
            await toggleVisited(ibgeCode);
          }}
        />
        <div className="min-h-0 flex-1">
          <MapExplorer
            scope={scope}
            visitedSet={visitedSet}
            photoSet={photoSet}
            highlightCode={highlightCode}
            onStateSelect={goState}
            onMunicipalitySelect={(ibgeCode, name) => {
              openMunicipalityDialog({
                ibgeCode,
                name: nameByCode.get(ibgeCode) ?? name,
                stateName:
                  scope.level === "state" ? scope.stateName : undefined,
                stateCode:
                  scope.level === "state" ? scope.stateCode : undefined,
              });
            }}
          />
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <RankingPanel
          brazil={ranking?.brazil}
          state={ranking?.state}
          isLoading={rankingLoading}
          showStateHint={scope.level !== "state"}
        />
      </aside>

      <MunicipalityPhotoDialog
        open={dialogOpen}
        municipality={selected}
        visited={selectedVisited}
        hasPhoto={selectedHasPhoto}
        busy={busy}
        onOpenChange={setDialogOpen}
        onMarkVisited={async () => {
          if (!selected || selectedVisited) return;
          await toggleVisited(selected.ibgeCode);
        }}
        onUnmarkVisited={async () => {
          if (!selected || !selectedVisited) return;
          await toggleVisited(selected.ibgeCode);
          setDialogOpen(false);
        }}
        onUpload={async (file) => {
          if (!selected) return;
          if (!visitedSet.has(selected.ibgeCode)) {
            await toggleVisited(selected.ibgeCode);
          }
          await uploadPhoto(selected.ibgeCode, file);
        }}
        onRemovePhoto={async () => {
          if (!selected) return;
          await removePhoto(selected.ibgeCode);
        }}
      />
    </div>
  );
}
