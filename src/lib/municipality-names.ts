import { STATE_IBGE_IDS, STATE_NAMES, STATE_TO_REGION } from "@/lib/regions";
import { prisma } from "@/lib/prisma";

type IbgeUF = { sigla: string; nome: string };

type IbgeMunicipality = {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao: { UF: IbgeUF };
  };
  "regiao-imediata"?: {
    "regiao-intermediaria": { UF: IbgeUF };
  };
};

function extractUF(m: IbgeMunicipality): IbgeUF | null {
  return (
    m.microrregiao?.mesorregiao.UF ??
    m["regiao-imediata"]?.["regiao-intermediaria"].UF ??
    null
  );
}

function looksLikeCode(value: string | undefined, code: string) {
  if (!value) return true;
  return value === code || /^\d+$/.test(value);
}

/** Nomes oficiais do IBGE para os municípios de uma UF. */
export async function fetchIbgeNamesForState(
  stateCode: string,
): Promise<Map<string, string>> {
  const ufId = STATE_IBGE_IDS[stateCode];
  if (!ufId) return new Map();

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`,
    { cache: "force-cache" },
  );

  if (!response.ok) {
    throw new Error(`Falha ao buscar nomes IBGE (${response.status})`);
  }

  const data = (await response.json()) as Array<{ id: number; nome: string }>;
  return new Map(data.map((m) => [String(m.id), m.nome]));
}

/**
 * Resolve nomes: banco primeiro; completa com API do IBGE quando faltar
 * ou quando o valor salvo for só o código numérico.
 * Se o banco estiver vazio para a UF, sincroniza sob demanda.
 */
export async function resolveMunicipalityNames(
  stateCode: string,
  ibgeCodes: string[],
): Promise<Map<string, string>> {
  const fromDb = await prisma.municipality.findMany({
    where: { stateCode },
    select: { ibgeCode: true, name: true },
  });

  const nameByCode = new Map(fromDb.map((m) => [m.ibgeCode, m.name]));
  const missing = ibgeCodes.filter((code) =>
    looksLikeCode(nameByCode.get(code), code),
  );

  if (missing.length === 0) {
    return nameByCode;
  }

  const fromIbge = await fetchIbgeNamesForState(stateCode);
  for (const [code, name] of fromIbge) {
    if (looksLikeCode(nameByCode.get(code), code)) {
      nameByCode.set(code, name);
    }
  }

  if (fromDb.length === 0 && fromIbge.size > 0) {
    const stateName = STATE_NAMES[stateCode] ?? stateCode;
    const regionName = STATE_TO_REGION[stateCode] ?? "Desconhecida";
    const rows = [...fromIbge.entries()].map(([ibgeCode, name]) => ({
      ibgeCode,
      name,
      stateCode,
      stateName,
      regionName,
    }));

    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await prisma.$transaction(
        chunk.map((row) =>
          prisma.municipality.upsert({
            where: { ibgeCode: row.ibgeCode },
            create: row,
            update: { name: row.name },
          }),
        ),
      );
    }
  }

  return nameByCode;
}

export async function seedAllMunicipalities() {
  const response = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Falha ao consultar IBGE: ${response.status}`);
  }

  const data = (await response.json()) as IbgeMunicipality[];
  const rows = data.flatMap((m) => {
    const uf = extractUF(m);
    if (!uf) return [];
    const stateCode = uf.sigla;
    return [
      {
        ibgeCode: String(m.id),
        name: m.nome,
        stateCode,
        stateName: STATE_NAMES[stateCode] ?? uf.nome,
        regionName: STATE_TO_REGION[stateCode] ?? "Desconhecida",
      },
    ];
  });

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((row) =>
        prisma.municipality.upsert({
          where: { ibgeCode: row.ibgeCode },
          create: row,
          update: {
            name: row.name,
            stateCode: row.stateCode,
            stateName: row.stateName,
            regionName: row.regionName,
          },
        }),
      ),
    );
  }

  return prisma.municipality.count();
}
