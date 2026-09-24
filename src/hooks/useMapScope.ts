"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BRAZIL_REGIONS,
  IBGE_ID_TO_STATE,
  STATE_IBGE_IDS,
  STATE_NAMES,
  type BrazilRegion,
} from "@/lib/regions";
import type { MapScope } from "@/types/map";

function normalizeStateCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (STATE_IBGE_IDS[normalized]) return normalized;
  return IBGE_ID_TO_STATE[normalized] ?? normalized;
}

function scopeFromStateCode(stateCode: string): MapScope {
  const code = normalizeStateCode(stateCode);
  return {
    level: "state",
    stateCode: code,
    stateName: STATE_NAMES[code] ?? code,
  };
}

export function useMapScope(initial: MapScope = { level: "brazil" }) {
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<MapScope>(() => {
    const state = searchParams.get("state");
    if (state && STATE_IBGE_IDS[normalizeStateCode(state)]) {
      return scopeFromStateCode(state);
    }
    return initial;
  });
  const [highlightCode, setHighlightCode] = useState<string | null>(
    () => searchParams.get("highlight"),
  );

  useEffect(() => {
    const state = searchParams.get("state");
    const highlight = searchParams.get("highlight");
    if (state && STATE_IBGE_IDS[normalizeStateCode(state)]) {
      setScope(scopeFromStateCode(state));
    }
    if (highlight) setHighlightCode(highlight);
  }, [searchParams]);

  const goBrazil = useCallback(() => {
    setScope({ level: "brazil" });
    setHighlightCode(null);
  }, []);

  const goRegion = useCallback((region: BrazilRegion) => {
    setScope({ level: "region", region });
    setHighlightCode(null);
  }, []);

  const goState = useCallback((stateCode: string) => {
    const code = normalizeStateCode(stateCode);
    setScope({
      level: "state",
      stateCode: code,
      stateName: STATE_NAMES[code] ?? code,
    });
    setHighlightCode(null);
  }, []);

  const breadcrumb = useMemo(() => {
    if (scope.level === "brazil") return ["Brasil"];
    if (scope.level === "region") return ["Brasil", scope.region];
    return ["Brasil", scope.stateName];
  }, [scope]);

  return {
    scope,
    setScope,
    goBrazil,
    goRegion,
    goState,
    breadcrumb,
    regions: BRAZIL_REGIONS,
    highlightCode,
    setHighlightCode,
  };
}
