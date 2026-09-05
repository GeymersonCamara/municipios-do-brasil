import type { BrazilRegion } from "@/lib/regions";

export type MapScope =
  | { level: "brazil" }
  | { level: "region"; region: BrazilRegion }
  | { level: "state"; stateCode: string; stateName: string };

export type MunicipalitySummary = {
  ibgeCode: string;
  name: string;
  stateCode: string;
  stateName: string;
  regionName: string;
};

export type StatsPayload = {
  total: number;
  visited: number;
  percent: number;
  scopeLabel: string;
};
