import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { STATE_TO_REGION, STATE_NAMES } from "../src/lib/regions";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

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

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não definida. Configure .env.local a partir de .env.example.",
    );
  }

  console.log("Buscando municípios na API do IBGE...");

  const response = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
  );

  if (!response.ok) {
    throw new Error(`Falha ao consultar IBGE: ${response.status}`);
  }

  const data = (await response.json()) as IbgeMunicipality[];
  console.log(`Recebidos ${data.length} municípios. Gravando no banco...`);

  const rows = data.flatMap((m) => {
    const uf = extractUF(m);
    if (!uf) return [];
    const stateCode = uf.sigla;
    const stateName = STATE_NAMES[stateCode] ?? uf.nome;
    const regionName = STATE_TO_REGION[stateCode] ?? "Desconhecida";

    return [
      {
        ibgeCode: String(m.id),
        name: m.nome,
        stateCode,
        stateName,
        regionName,
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
    console.log(
      `Progresso: ${Math.min(i + chunkSize, rows.length)}/${rows.length}`,
    );
  }

  const total = await prisma.municipality.count();
  console.log(`Seed concluído. Total no banco: ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
