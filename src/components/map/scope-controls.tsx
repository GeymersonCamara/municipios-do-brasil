"use client";

import { ChevronRight } from "lucide-react";
import { BRAZIL_REGIONS, STATE_CODES, STATE_NAMES } from "@/lib/regions";
import type { MapScope } from "@/types/map";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScopeControlsProps = {
  scope: MapScope;
  onBrazil: () => void;
  onRegion: (region: (typeof BRAZIL_REGIONS)[number]) => void;
  onState: (stateCode: string) => void;
};

export function ScopeControls({
  scope,
  onBrazil,
  onRegion,
  onState,
}: ScopeControlsProps) {
  return (
    <div className="space-y-3">
      <nav aria-label="Navegação do mapa" className="flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          onClick={onBrazil}
          className={cn(
            "rounded px-1.5 py-0.5 hover:bg-accent",
            scope.level === "brazil" && "font-semibold text-primary",
          )}
        >
          Brasil
        </button>
        {scope.level === "region" && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-primary">{scope.region}</span>
          </>
        )}
        {scope.level === "state" && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-primary">{scope.stateName}</span>
          </>
        )}
      </nav>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={scope.level === "brazil" ? "default" : "outline"}
          onClick={onBrazil}
        >
          Brasil inteiro
        </Button>
        {BRAZIL_REGIONS.map((region) => (
          <Button
            key={region}
            type="button"
            size="sm"
            variant={
              scope.level === "region" && scope.region === region
                ? "default"
                : "outline"
            }
            onClick={() => onRegion(region)}
          >
            {region}
          </Button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Ir para estado
        </label>
        <select
          className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
          value={scope.level === "state" ? scope.stateCode : ""}
          onChange={(event) => {
            if (event.target.value) onState(event.target.value);
          }}
          aria-label="Selecionar estado"
        >
          <option value="">Selecione um estado…</option>
          {STATE_CODES.map((code) => (
            <option key={code} value={code}>
              {STATE_NAMES[code]} ({code})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
