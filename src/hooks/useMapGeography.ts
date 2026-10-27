"use client";

import { useQuery } from "@tanstack/react-query";
import {
  expectsSingleMunicipality,
  filterGeoJSONByRegion,
  type BrazilGeoJSON,
} from "@/lib/ibge-geo";
import type { MapScope } from "@/types/map";

function scopeKey(scope: MapScope) {
  if (scope.level === "region") return ["geo", "region", scope.region] as const;
  if (scope.level === "state") return ["geo", "state", scope.stateCode] as const;
  return ["geo", "brazil"] as const;
}

async function fetchStaticGeo(path: string): Promise<BrazilGeoJSON> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar malha (${res.status})`);
  const geo = (await res.json()) as BrazilGeoJSON;
  if (!geo.features?.length) throw new Error("Malha geográfica veio vazia");
  return geo;
}

async function fetchMapGeography(scope: MapScope): Promise<BrazilGeoJSON> {
  if (scope.level === "state") {
    const geo = await fetchStaticGeo(`/geo/states/${scope.stateCode}.json`);
    if (geo.features.length < 2 && !expectsSingleMunicipality(scope.stateCode)) {
      throw new Error(
        "A malha do estado retornou um único polígono (contorno). Esperado: municípios individuais.",
      );
    }
    return geo;
  }

  const brazil = await fetchStaticGeo("/geo/brazil.json");
  return scope.level === "region"
    ? filterGeoJSONByRegion(brazil, scope.region)
    : brazil;
}

export function useMapGeography(scope: MapScope) {
  return useQuery({
    queryKey: scopeKey(scope),
    queryFn: () => fetchMapGeography(scope),
    staleTime: Infinity,
    retry: 1,
  });
}
