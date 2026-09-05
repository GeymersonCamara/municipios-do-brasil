"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BRAZIL_REGIONS,
  STATE_NAMES,
  type BrazilRegion,
} from "@/lib/regions";
import type { MapScope } from "@/types/map";

export function useMapScope(initial: MapScope = { level: "brazil" }) {
  const [scope, setScope] = useState<MapScope>(initial);
  const [highlightCode, setHighlightCode] = useState<string | null>(null);

  const goBrazil = useCallback(() => {
    setScope({ level: "brazil" });
    setHighlightCode(null);
  }, []);

  const goRegion = useCallback((region: BrazilRegion) => {
    setScope({ level: "region", region });
    setHighlightCode(null);
  }, []);

  const goState = useCallback((stateCode: string) => {
    setScope({
      level: "state",
      stateCode,
      stateName: STATE_NAMES[stateCode] ?? stateCode,
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
