import { geoArea } from "d3-geo";
import {
  IBGE_ID_TO_STATE,
  STATE_IBGE_IDS,
  STATE_NAMES,
  STATE_TO_REGION,
  type BrazilRegion,
} from "@/lib/regions";

const MALHAS_BASE = "https://servicodados.ibge.gov.br/api/v3/malhas";

export type GeoFeatureProperties = {
  codarea?: string;
  name?: string;
  stateCode?: string;
  regionName?: string;
  [key: string]: unknown;
};

export type BrazilGeoJSON = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  GeoFeatureProperties
>;

/**
 * IBGE devolve anéis exteriores em sentido horário. O d3-geo (regra da mão direita)
 * interpreta isso como "planeta inteiro − polígono", e fitSize colapsa o mapa.
 * Corrigimos o winding antes de projetar.
 */
function fixPolygonRings(coordinates: number[][][]): number[][][] {
  return coordinates.map((ring, index) => {
    const test: GeoJSON.Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [ring] },
    };
    const area = geoArea(test);
    const isExterior = index === 0;
    const wrong = isExterior ? area > Math.PI : area < Math.PI;
    return wrong ? ring.slice().reverse() : ring;
  });
}

export function rewindGeoJSON(geo: BrazilGeoJSON): BrazilGeoJSON {
  return {
    type: "FeatureCollection",
    features: geo.features.map((feature) => {
      const geom = feature.geometry;
      if (!geom) return feature;

      if (geom.type === "Polygon") {
        return {
          ...feature,
          geometry: {
            type: "Polygon",
            coordinates: fixPolygonRings(geom.coordinates as number[][][]),
          },
        };
      }

      if (geom.type === "MultiPolygon") {
        return {
          ...feature,
          geometry: {
            type: "MultiPolygon",
            coordinates: (geom.coordinates as number[][][][]).map(
              fixPolygonRings,
            ),
          },
        };
      }

      return feature;
    }),
  };
}

/**
 * Malha de municípios de um estado (IBGE).
 * Sem `intrarregiao=municipio` a API devolve só o contorno da UF (1 feature).
 */
export async function fetchMalhaMunicipios(
  codigoUF: string,
): Promise<BrazilGeoJSON> {
  const url = `${MALHAS_BASE}/estados/${codigoUF}?formato=application/vnd.geo+json&intrarregiao=municipio`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(
      `Falha ao buscar malha do estado ${codigoUF}: ${res.status}`,
    );
  }

  const geojson = (await res.json()) as BrazilGeoJSON;

  if (!geojson.features || geojson.features.length === 0) {
    throw new Error(`Malha do estado ${codigoUF} veio vazia`);
  }

  if (geojson.features.length === 1) {
    throw new Error(
      `Malha do estado ${codigoUF} retornou apenas 1 polígono (contorno da UF). Verifique intrarregiao=municipio.`,
    );
  }

  return rewindGeoJSON(geojson);
}

async function fetchMalhaEstadosBrasil(): Promise<BrazilGeoJSON> {
  const url = `${MALHAS_BASE}/paises/BR?formato=application/vnd.geo+json&intrarregiao=UF`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Falha ao buscar malha do Brasil: ${res.status}`);
  }

  const geojson = (await res.json()) as BrazilGeoJSON;

  if (!geojson.features || geojson.features.length < 2) {
    throw new Error("Malha do Brasil veio vazia ou incompleta");
  }

  return rewindGeoJSON(geojson);
}

export async function fetchBrazilStatesGeoJSON(): Promise<BrazilGeoJSON> {
  const geo = await fetchMalhaEstadosBrasil();

  return {
    type: "FeatureCollection",
    features: geo.features.map((feature) => {
      const id = String(feature.properties?.codarea ?? feature.id ?? "");
      const stateCode = IBGE_ID_TO_STATE[id] ?? "";
      return {
        ...feature,
        id: stateCode || id,
        properties: {
          ...feature.properties,
          codarea: id,
          stateCode,
          name: STATE_NAMES[stateCode] ?? id,
          regionName: STATE_TO_REGION[stateCode],
        },
      };
    }),
  };
}

export async function fetchStateMunicipalitiesGeoJSON(
  stateCodeOrIbgeId: string,
): Promise<BrazilGeoJSON> {
  const normalized = stateCodeOrIbgeId.trim().toUpperCase();
  const stateCode =
    STATE_IBGE_IDS[normalized]
      ? normalized
      : IBGE_ID_TO_STATE[normalized] ?? "";
  const ufId = STATE_IBGE_IDS[stateCode];

  if (!ufId || !stateCode) {
    throw new Error(`UF inválida: ${stateCodeOrIbgeId}`);
  }

  const geo = await fetchMalhaMunicipios(ufId);

  return {
    type: "FeatureCollection",
    features: geo.features.map((feature) => {
      const ibgeCode = String(feature.properties?.codarea ?? feature.id ?? "");
      return {
        ...feature,
        id: ibgeCode,
        properties: {
          ...feature.properties,
          codarea: ibgeCode,
          stateCode,
          name: feature.properties?.name,
          regionName: STATE_TO_REGION[stateCode],
        },
      };
    }),
  };
}

export function filterGeoJSONByRegion(
  geo: BrazilGeoJSON,
  region: BrazilRegion,
): BrazilGeoJSON {
  const features = geo.features.filter(
    (f) => f.properties?.regionName === region,
  );

  if (features.length === 0) {
    throw new Error(`Nenhum estado encontrado para a região ${region}`);
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
