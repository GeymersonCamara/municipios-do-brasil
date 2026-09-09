import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não definida. Configure .env.local a partir de .env.example.",
    );
  }

  console.log("Buscando municípios na API do IBGE...");
  const { seedAllMunicipalities } = await import("../src/lib/municipality-names");
  const total = await seedAllMunicipalities();
  console.log(`Seed concluído. Total no banco: ${total}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
