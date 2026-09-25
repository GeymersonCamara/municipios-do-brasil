import { spawnSync } from "node:child_process";

/**
 * Neon pooler (PgBouncer) não segura bem advisory locks do Prisma Migrate.
 * Preferimos DIRECT_URL; senão removemos "-pooler." do host do DATABASE_URL.
 */
function deriveDirectUrl(url) {
  const parsed = new URL(url);
  if (parsed.hostname.includes("-pooler.")) {
    parsed.hostname = parsed.hostname.replace("-pooler.", ".");
  }
  parsed.searchParams.delete("pgbouncer");
  return parsed.toString();
}

function runMigrate(env) {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env,
    shell: true,
  });
  return result.status ?? 1;
}

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy-wait curto o suficiente para retry de lock no build da Vercel
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL ausente — não é possível rodar migrate deploy.");
  process.exit(1);
}

const migrateUrl = process.env.DIRECT_URL?.trim() || deriveDirectUrl(databaseUrl);

if (migrateUrl !== databaseUrl) {
  console.log(
    "migrate deploy usando conexão direta (sem pooler) para evitar timeout de advisory lock…",
  );
} else {
  console.log("migrate deploy usando DATABASE_URL…");
}

const env = { ...process.env, DATABASE_URL: migrateUrl };

let code = runMigrate(env);
if (code !== 0) {
  console.warn(
    "migrate falhou (possível lock residual). Aguardando 20s e tentando de novo…",
  );
  sleepSync(20_000);
  code = runMigrate(env);
}

process.exit(code);
