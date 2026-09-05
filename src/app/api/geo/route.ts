import { NextRequest, NextResponse } from "next/server";
import {
  fetchBrazilStatesGeoJSON,
  fetchStateMunicipalitiesGeoJSON,
  filterGeoJSONByRegion,
} from "@/lib/ibge-geo";
import { BRAZIL_REGIONS, type BrazilRegion } from "@/lib/regions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const level = request.nextUrl.searchParams.get("level") ?? "brazil";
  const region = request.nextUrl.searchParams.get("region");
  const stateCode = request.nextUrl.searchParams.get("stateCode");

  try {
    if (level === "state") {
      if (!stateCode) {
        return NextResponse.json(
          { error: "stateCode é obrigatório" },
          { status: 400 },
        );
      }

      const [geo, municipalities] = await Promise.all([
        fetchStateMunicipalitiesGeoJSON(stateCode),
        prisma.municipality.findMany({
          where: { stateCode },
          select: { ibgeCode: true, name: true },
        }),
      ]);

      if (geo.features.length < 2) {
        return NextResponse.json(
          {
            error:
              "Malha do estado retornou contorno único em vez de municípios",
          },
          { status: 502 },
        );
      }

      const nameByCode = new Map(
        municipalities.map((m) => [m.ibgeCode, m.name]),
      );

      const enriched = {
        type: "FeatureCollection" as const,
        features: geo.features.map((feature) => {
          const code = String(feature.properties?.codarea ?? feature.id ?? "");
          return {
            ...feature,
            properties: {
              ...feature.properties,
              codarea: code,
              name: nameByCode.get(code) ?? code,
            },
          };
        }),
      };

      return NextResponse.json(enriched, {
        headers: {
          "Cache-Control": "no-store",
          "X-Feature-Count": String(enriched.features.length),
        },
      });
    }

    const states = await fetchBrazilStatesGeoJSON();
    const geo =
      level === "region" &&
      region &&
      BRAZIL_REGIONS.includes(region as BrazilRegion)
        ? filterGeoJSONByRegion(states, region as BrazilRegion)
        : states;

    return NextResponse.json(geo, {
      headers: {
        "Cache-Control": "no-store",
        "X-Feature-Count": String(geo.features.length),
      },
    });
  } catch (error) {
    console.error("geo error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a malha geográfica",
      },
      { status: 502 },
    );
  }
}
