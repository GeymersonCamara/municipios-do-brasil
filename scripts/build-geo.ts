import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  fetchBrazilStatesGeoJSON,
  fetchStateMunicipalitiesGeoJSON,
  type BrazilGeoJSON,
} from "../src/lib/ibge-geo";
import { STATE_CODES, STATE_IBGE_IDS } from "../src/lib/regions";

/**
 * Baixa as malhas do IBGE e grava em public/geo como arquivos estáticos.
 * A API de malhas não responde a partir dos servidores da Vercel, então o
 * mapa em produção lê só esses arquivos. Rode de novo quando o IBGE mudar.
 *
 *   npx tsx scripts/build-geo.ts
 */

const OUT_DIR = join(process.cwd(), "public", "geo");
const PRECISION = 4;

function roundCoordinates(value: unknown): unknown {
  if (typeof value === "number") return Number(value.toFixed(PRECISION));
  if (Array.isArray(value)) return value.map(roundCoordinates);
  return value;
}

function compact(geo: BrazilGeoJSON): BrazilGeoJSON {
  return {
    type: "FeatureCollection",
    features: geo.features.map((feature) => ({
      ...feature,
      geometry: feature.geometry && {
        ...feature.geometry,
        coordinates: roundCoordinates(
          (feature.geometry as GeoJSON.Polygon).coordinates,
        ),
      } as GeoJSON.Geometry,
    })),
  };
}

async function fetchNames(stateCode: string) {
  const ufId = STATE_IBGE_IDS[stateCode];
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`,
  );
  if (!res.ok) throw new Error(`Nomes de ${stateCode}: ${res.status}`);
  const data = (await res.json()) as Array<{ id: number; nome: string }>;
  return new Map(data.map((m) => [String(m.id), m.nome]));
}

async function save(path: string, geo: BrazilGeoJSON) {
  const body = JSON.stringify(compact(geo));
  await writeFile(path, body);
  return body.length;
}

async function main() {
  await mkdir(join(OUT_DIR, "states"), { recursive: true });

  const brazil = await fetchBrazilStatesGeoJSON();
  const brazilBytes = await save(join(OUT_DIR, "brazil.json"), brazil);
  console.log(`brazil.json  ${brazil.features.length} estados  ${brazilBytes} bytes`);

  let total = brazilBytes;
  for (const stateCode of STATE_CODES) {
    const [geo, names] = await Promise.all([
      fetchStateMunicipalitiesGeoJSON(stateCode),
      fetchNames(stateCode),
    ]);
    const named: BrazilGeoJSON = {
      type: "FeatureCollection",
      features: geo.features.map((feature) => {
        const code = String(feature.properties?.codarea ?? feature.id ?? "");
        return {
          ...feature,
          properties: {
            ...feature.properties,
            codarea: code,
            name: names.get(code) ?? code,
          },
        };
      }),
    };
    const bytes = await save(join(OUT_DIR, "states", `${stateCode}.json`), named);
    total += bytes;
    console.log(`${stateCode}.json  ${named.features.length} municípios  ${bytes} bytes`);
  }

  console.log(`Total: ${(total / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
