import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

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

function localMigrations() {
  const dir = join(process.cwd(), "prisma", "migrations");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
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
    // busy-wait para retry curto no build da Vercel
  }
}

async function clearAdvisoryLocks(prisma) {
  // Libera locks de migrate de builds anteriores que travaram
  const fromLocks = await prisma.$queryRaw`
    SELECT pg_terminate_backend(l.pid) AS terminated
    FROM pg_locks l
    WHERE l.locktype = 'advisory'
      AND l.pid IS NOT NULL
      AND l.pid <> pg_backend_pid()
  `;

  // Sessões idle in transaction também seguram lock
  const fromIdle = await prisma.$queryRaw`
    SELECT pg_terminate_backend(a.pid) AS terminated
    FROM pg_stat_activity a
    WHERE a.datname = current_database()
      AND a.pid <> pg_backend_pid()
      AND a.state = 'idle in transaction'
      AND a.state_change < NOW() - INTERVAL '15 seconds'
  `;

  const terminated =
    (Array.isArray(fromLocks) ? fromLocks.length : 0) +
    (Array.isArray(fromIdle) ? fromIdle.length : 0);

  if (terminated > 0) {
    console.log(`Sessões com lock residual encerradas: ${terminated}`);
  } else {
    console.log("Nenhum advisory lock residual encontrado.");
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL ausente — não é possível rodar migrate deploy.");
    process.exit(1);
  }

  const migrateUrl =
    process.env.DIRECT_URL?.trim() || deriveDirectUrl(databaseUrl);

  if (migrateUrl !== databaseUrl) {
    console.log(
      "migrate usando conexão direta (sem pooler)…",
    );
  }

  const env = { ...process.env, DATABASE_URL: migrateUrl };
  const prisma = new PrismaClient({
    datasources: { db: { url: migrateUrl } },
  });

  try {
    try {
      await clearAdvisoryLocks(prisma);
    } catch (error) {
      console.warn(
        "Não foi possível limpar advisory locks:",
        error instanceof Error ? error.message : error,
      );
    }

    let appliedNames = new Set();
    try {
      const rows = await prisma.$queryRaw`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL
      `;
      appliedNames = new Set(
        (rows ?? []).map((row) => String(row.migration_name)),
      );
    } catch (error) {
      console.warn(
        "Tabela _prisma_migrations indisponível; seguindo com migrate deploy.",
        error instanceof Error ? error.message : error,
      );
      await prisma.$disconnect();
      process.exit(runMigrate(env));
    }

    const pending = localMigrations().filter((name) => !appliedNames.has(name));

    if (pending.length === 0) {
      console.log(
        "Nenhuma migration pendente — pulando prisma migrate deploy (evita advisory lock).",
      );
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`Migrations pendentes: ${pending.join(", ")}`);
    await prisma.$disconnect();

    let code = runMigrate(env);
    if (code !== 0) {
      console.warn(
        "migrate falhou. Limpando locks de novo, aguardando 15s e tentando outra vez…",
      );
      const retryPrisma = new PrismaClient({
        datasources: { db: { url: migrateUrl } },
      });
      try {
        await clearAdvisoryLocks(retryPrisma);
      } catch {
        // ignore
      }
      await retryPrisma.$disconnect().catch(() => {});
      sleepSync(15_000);
      code = runMigrate(env);
    }

    process.exit(code);
  } catch (error) {
    console.error(error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
