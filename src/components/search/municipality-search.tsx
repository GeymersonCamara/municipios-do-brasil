"use client";

import { Check, Search } from "lucide-react";
import { useState } from "react";
import { useMunicipalitySearch } from "@/hooks/useMunicipalitySearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MunicipalitySummary } from "@/types/map";

type MunicipalitySearchProps = {
  visitedSet: Set<string>;
  onSelect: (municipality: MunicipalitySummary) => void;
  onToggleVisited: (ibgeCode: string) => void;
};

export function MunicipalitySearch({
  visitedSet,
  onSelect,
  onToggleVisited,
}: MunicipalitySearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isSearching, isError } = useMunicipalitySearch(query);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Buscar município..."
          className="pl-9"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-background shadow-lg">
          {isSearching && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando…</p>
          )}
          {isError && (
            <p className="px-3 py-2 text-sm text-destructive">
              Erro ao buscar municípios
            </p>
          )}
          {!isSearching && data?.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Nenhum município encontrado
            </p>
          )}
          <ul role="listbox">
            {data?.map((item) => {
              const visited = visitedSet.has(item.ibgeCode);
              return (
                <li
                  key={item.ibgeCode}
                  className="flex items-center gap-2 border-b border-border/60 px-2 py-1.5 last:border-0"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onSelect(item);
                      setQuery(`${item.name} — ${item.stateCode}`);
                      setOpen(false);
                    }}
                  >
                    <span className="block truncate font-medium">
                      {item.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.stateName} · {item.regionName}
                    </span>
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant={visited ? "secondary" : "outline"}
                    className={cn("shrink-0", visited && "text-visited")}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onToggleVisited(item.ibgeCode)}
                    aria-pressed={visited}
                  >
                    {visited ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Visitado
                      </>
                    ) : (
                      "Marcar"
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
