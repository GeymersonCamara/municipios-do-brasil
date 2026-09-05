"use client";

import { useQuery } from "@tanstack/react-query";
import type { BrazilGeoJSON } from "@/lib/ibge-geo";
import type { MapScope } from "@/types/map";

function scopeQuery(scope: MapScope) {
  const params = new URLSearchParams({ level: scope.level });
  if (scope.level === "region") params.set("region", scope.region);
  if (scope.level === "state") params.set("stateCode", scope.stateCode);
  return params.toString();
}

function scopeKey(scope: MapScope) {
  if (scope.level === "region") return ["geo", "region", scope.region] as const;
  if (scope.level === "state") return ["geo", "state", scope.stateCode] as const;
  return ["geo", "brazil"] as const;
}

async function fetchMapGeography(scope: MapScope): Promise<BrazilGeoJSON> {
  const res = await fetch(`/api/geo?${scopeQuery(scope)}`, {
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : `Falha ao carregar malha (${res.status})`,
    );
  }

  const geo = payload as BrazilGeoJSON;

  if (!geo.features?.length) {
    throw new Error("Malha geográfica veio vazia");
  }

  if (scope.level === "state" && geo.features.length < 2) {
    throw new Error(
      "A malha do estado retornou um único polígono (contorno). Esperado: municípios individuais.",
    );
  }

  return geo;
}

export function useMapGeography(scope: MapScope) {
  return useQuery({
    queryKey: scopeKey(scope),
    queryFn: () => fetchMapGeography(scope),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
